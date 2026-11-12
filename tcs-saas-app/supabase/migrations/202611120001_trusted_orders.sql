-- Staging first. Consolidates policies on users/products/orders/order_items.
-- Apply before deploying the RPC-based customer checkout and POS.
begin;

create or replace function public.is_staff_or_admin(shop uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.users u where u.id = auth.uid()
    and u.org_id = shop and u.role in ('staff', 'admin'));
$$;
create or replace function public.is_shop_admin(shop uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.users u where u.id = auth.uid()
    and u.org_id = shop and u.role = 'admin');
$$;
revoke all on function public.is_staff_or_admin(uuid), public.is_shop_admin(uuid) from public;
grant execute on function public.is_staff_or_admin(uuid), public.is_shop_admin(uuid) to anon, authenticated;

-- Remove old permissive/recursive policies rather than accumulating OR rules.
do $$ declare p record; begin
  for p in select tablename, policyname from pg_policies where schemaname = 'public'
    and tablename in ('users', 'products', 'orders', 'order_items')
  loop execute format('drop policy %I on public.%I', p.policyname, p.tablename); end loop;
end $$;

alter table public.users enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Table revocation alone does not remove existing column grants.
do $$ declare t text; c record; begin
  foreach t in array array['users', 'products', 'orders', 'order_items'] loop
    execute format('revoke all on public.%I from public, anon, authenticated', t);
    for c in select column_name from information_schema.columns
      where table_schema = 'public' and table_name = t
    loop
      execute format('revoke select (%I), insert (%I), update (%I), references (%I) on public.%I from public, anon, authenticated',
        c.column_name, c.column_name, c.column_name, c.column_name, t);
    end loop;
  end loop;
end $$;

grant select on public.users, public.orders, public.order_items to authenticated;
grant update (name, phone, avatar_url) on public.users to authenticated;
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant update (status, payment_status) on public.orders to authenticated;

create policy profile_read on public.users for select to authenticated
  using (id = auth.uid() or public.is_shop_admin(org_id));
create policy profile_update on public.users for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy product_read on public.products for select to anon, authenticated
  using (is_available or public.is_staff_or_admin(shop_id));
create policy product_insert on public.products for insert to authenticated
  with check (public.is_shop_admin(shop_id));
create policy product_update on public.products for update to authenticated
  using (public.is_shop_admin(shop_id)) with check (public.is_shop_admin(shop_id));
create policy product_delete on public.products for delete to authenticated
  using (public.is_shop_admin(shop_id));
create policy order_read on public.orders for select to authenticated
  using (customer_id = auth.uid() or public.is_staff_or_admin(shop_id));
create policy order_update on public.orders for update to authenticated
  using (public.is_staff_or_admin(shop_id)) with check (public.is_staff_or_admin(shop_id));
create policy order_item_read on public.order_items for select to authenticated using (
  exists (select 1 from public.orders o where o.id = order_id
    and (o.customer_id = auth.uid() or public.is_staff_or_admin(o.shop_id)))
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.users (id, role, name, email)
  values (new.id, 'customer', coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.orders add column if not exists idempotency_key uuid;
alter table public.orders add column if not exists request_payload jsonb;
alter table public.orders add column if not exists payment_confirmed_by uuid references public.users(id);
alter table public.orders add column if not exists payment_confirmed_at timestamptz;
create unique index if not exists orders_customer_idempotency_key
  on public.orders(customer_id, idempotency_key) where idempotency_key is not null;

create or replace function public.guard_order_transition()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.payment_status is distinct from old.payment_status then
    if old.payment_status = 'paid' or old.status in ('completed', 'cancelled') or
       not public.is_staff_or_admin(old.shop_id) then
      raise exception 'Invalid payment transition' using errcode = '42501';
    end if;
    new.payment_confirmed_by := auth.uid();
    new.payment_confirmed_at := now();
  end if;
  if new.status is distinct from old.status and not (
    (old.status = 'pending' and new.status in ('confirmed', 'cancelled')) or
    (old.status = 'confirmed' and new.status in ('preparing', 'cancelled')) or
    (old.status = 'preparing' and new.status in ('ready', 'cancelled')) or
    (old.status = 'ready' and new.status in ('completed', 'cancelled'))
  ) then raise exception 'Invalid order transition' using errcode = '22023'; end if;
  if new.status in ('confirmed', 'preparing', 'ready', 'completed') and new.payment_status <> 'paid' then
    raise exception 'Verify payment before processing the order' using errcode = '22023';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_order_transition() from public, anon, authenticated;
drop trigger if exists guard_order_transition on public.orders;
create trigger guard_order_transition before update on public.orders
  for each row execute function public.guard_order_transition();

create or replace function public.create_order(
  p_shop_id uuid, p_items jsonb, p_type text, p_payment_method text,
  p_idempotency_key uuid, p_table_number text default null, p_notes text default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  item jsonb;
  catalog public.products%rowtype;
  quantity integer;
  quantity_sum integer := 0;
  amount numeric := 0;
  snapshots jsonb := '[]'::jsonb;
  request jsonb;
  existing public.orders%rowtype;
  order_id uuid;
begin
  if actor is null or not exists (select 1 from public.users where id = actor) then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_idempotency_key is null or p_shop_id is null or
    not exists (select 1 from public.organizations where id = p_shop_id and type = 'shop') then
    raise exception 'Invalid shop or request key' using errcode = '22023';
  end if;
  if p_type is null or p_type not in ('pickup', 'dine_in') or
     p_payment_method is null or p_payment_method not in ('qris', 'cash') or
     length(p_notes) > 1000 or length(p_table_number) > 30 or
     (p_type = 'dine_in' and nullif(btrim(p_table_number), '') is null) then
    raise exception 'Invalid order details' using errcode = '22023';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Items must be an array' using errcode = '22023';
  end if;
  if jsonb_array_length(p_items) not between 1 and 50 then
    raise exception 'Invalid item count' using errcode = '22023';
  end if;
  request := jsonb_build_object('shop', p_shop_id, 'items', p_items, 'type', p_type,
    'payment', p_payment_method, 'table', p_table_number, 'notes', p_notes);
  select * into existing from public.orders where customer_id = actor and idempotency_key = p_idempotency_key;
  if found then
    if existing.request_payload is distinct from request then
      raise exception 'Request key already used for a different order' using errcode = '22023';
    end if;
    return jsonb_build_object('id', existing.id, 'total', existing.total);
  end if;
  for item in select value from jsonb_array_elements(p_items) loop
    if jsonb_typeof(item) <> 'object' or
       (item - array['product_id', 'quantity', 'notes']) <> '{}'::jsonb or
       jsonb_typeof(item->'product_id') is distinct from 'string' or
       jsonb_typeof(item->'quantity') is distinct from 'number' or
       (item->>'quantity') !~ '^[0-9]{1,2}$' or
       (item->>'product_id') !~* '^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$' or
       (item ? 'notes' and jsonb_typeof(item->'notes') not in ('string', 'null')) or
       length(item->>'notes') > 200 then
      raise exception 'Invalid order item' using errcode = '22023';
    end if;
    quantity := (item->>'quantity')::integer;
    quantity_sum := quantity_sum + quantity;
    if quantity < 1 or quantity_sum > 500 then
      raise exception 'Invalid quantity' using errcode = '22023';
    end if;
    select * into catalog from public.products where id = (item->>'product_id')::uuid for share;
    if not found or catalog.shop_id <> p_shop_id or not catalog.is_available or catalog.price < 0 then
      raise exception 'Product unavailable' using errcode = '22023';
    end if;
    amount := amount + catalog.price * quantity;
    if amount > 99999999.99 then raise exception 'Order total too large' using errcode = '22023'; end if;
    snapshots := snapshots || jsonb_build_array(jsonb_build_object('product_id', catalog.id,
      'quantity', quantity, 'unit_price', catalog.price, 'subtotal', catalog.price * quantity, 'notes', item->>'notes'));
  end loop;
  insert into public.orders (shop_id, customer_id, type, table_number, status, payment_method,
    payment_status, subtotal, discount, total, notes, idempotency_key, request_payload)
  values (p_shop_id, actor, p_type, case when p_type = 'dine_in' then p_table_number end,
    'pending', p_payment_method, 'pending', amount, 0, amount, p_notes, p_idempotency_key, request)
  on conflict (customer_id, idempotency_key) where idempotency_key is not null do nothing
  returning id into order_id;
  if order_id is null then
    select * into existing from public.orders where customer_id = actor and idempotency_key = p_idempotency_key;
    if existing.request_payload is distinct from request then
      raise exception 'Request key already used for a different order' using errcode = '22023';
    end if;
    return jsonb_build_object('id', existing.id, 'total', existing.total);
  end if;
  insert into public.order_items (order_id, product_id, quantity, unit_price, subtotal, notes)
  select order_id, x.product_id, x.quantity, x.unit_price, x.subtotal, x.notes
  from jsonb_to_recordset(snapshots) as x(product_id uuid, quantity integer, unit_price numeric, subtotal numeric, notes text);
  return jsonb_build_object('id', order_id, 'total', amount);
end;
$$;
revoke all on function public.create_order(uuid, jsonb, text, text, uuid, text, text) from public, anon;
grant execute on function public.create_order(uuid, jsonb, text, text, uuid, text, text) to authenticated;
notify pgrst, 'reload schema';
commit;
