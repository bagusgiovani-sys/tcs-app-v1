/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS Node test harness. */
const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { join } = require('node:path')
const { PGlite } = require('@electric-sql/pglite')

let db
const shopA = '10000000-0000-0000-0000-000000000001'
const shopB = '10000000-0000-0000-0000-000000000002'
const customerA = '20000000-0000-0000-0000-000000000001'
const customerB = '20000000-0000-0000-0000-000000000002'
const adminA = '20000000-0000-0000-0000-000000000003'
const staffA = '20000000-0000-0000-0000-000000000004'
const adminB = '20000000-0000-0000-0000-000000000005'
const productA = '30000000-0000-0000-0000-000000000001'
const productB = '30000000-0000-0000-0000-000000000002'
const unavailable = '30000000-0000-0000-0000-000000000003'
let sequence = 0
const requestKey = () => `40000000-0000-0000-0000-${String(++sequence).padStart(12, '0')}`
const migration = readFileSync(join(__dirname, '../supabase/migrations/202611120001_trusted_orders.sql'), 'utf8')

async function as(user, callback, role = 'authenticated') {
  await db.exec(`set role ${role}`)
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [user ?? ''])
  try { return await callback() } finally { await db.exec('reset role') }
}
async function order(items = [{ product_id: productA, quantity: 2 }], key = requestKey(), overrides = {}) {
  const args = { shop: shopA, type: 'pickup', method: 'qris', table: null, notes: null, ...overrides }
  const result = await db.query('select public.create_order($1,$2::jsonb,$3,$4,$5,$6,$7) as result',
    [args.shop, JSON.stringify(items), args.type, args.method, key, args.table, args.notes])
  return result.rows[0].result
}

before(async () => {
  db = new PGlite()
  await db.exec(`
    create role anon nologin; create role authenticated nologin;
    create schema auth;
    create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;
    grant usage on schema public, auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
  `)
  await db.exec(readFileSync(join(__dirname, '../supabase-schema.sql'), 'utf8'))
  // Model Supabase defaults and a pre-existing unsafe column grant.
  await db.exec(`grant all on all tables in schema public to anon, authenticated;
    grant update(role), insert(role) on public.users to authenticated;
    create policy legacy_public_insert on public.users for insert with check (true);
    create policy legacy_recursive_read on public.users for select using (
      exists(select 1 from public.users me where me.id=auth.uid() and me.role='admin'));
  `)
  await db.exec(migration)
  await db.exec(`insert into public.organizations(id,type,name,slug) values
    ('${shopA}','shop','A','a'), ('${shopB}','shop','B','b');
    insert into auth.users(id,email,raw_user_meta_data) values
    ('${customerA}','a@test.invalid','{"role":"admin","org_id":"${shopA}"}'),
    ('${customerB}','b@test.invalid','{}'), ('${adminA}','admin-a@test.invalid','{}'),
    ('${staffA}','staff-a@test.invalid','{}'), ('${adminB}','admin-b@test.invalid','{}');
    update public.users set role='admin', org_id='${shopA}' where id='${adminA}';
    update public.users set role='staff', org_id='${shopA}' where id='${staffA}';
    update public.users set role='admin', org_id='${shopB}' where id='${adminB}';
    insert into public.products(id,shop_id,name,price,category,is_available) values
    ('${productA}','${shopA}','Coffee',18000,'coffee',true),
    ('${productB}','${shopB}','Foreign Coffee',10000,'coffee',true),
    ('${unavailable}','${shopA}','Unavailable',9000,'coffee',false);`)
}, { timeout: 120000 })
after(async () => { await db?.close() })

test('signup ignores role/org metadata; profile reads do not recurse; protected columns stay unwritable', async () => {
  await as(customerA, async () => {
    const profile = (await db.query('select * from public.users')).rows
    assert.equal(profile.length, 1)
    assert.equal(profile[0].role, 'customer')
    assert.equal(profile[0].org_id, null)
    for (const assignment of ["role='admin'", `org_id='${shopA}'`, "email='forged@test.invalid'"]) {
      await assert.rejects(() => db.exec(`update public.users set ${assignment} where id='${customerA}'`), /permission denied/)
    }
    await assert.rejects(() => db.exec(`insert into public.users(id,role) values ('${customerA}','admin')`), /permission denied/)
    await db.query('update public.users set name=$1 where id=$2', ['Safe name', customerA])
  })
})

test('anonymous access cannot create orders or read profiles; public available menu still works', async () => {
  await as(null, async () => {
    assert.equal((await db.query('select id from public.products')).rows.length, 2)
    await assert.rejects(() => db.query('select * from public.users'), /permission denied/)
    await assert.rejects(() => order(), /permission denied/)
  }, 'anon')
})

test('catalog pricing, atomic snapshots, fixed pending statuses and idempotent retries', async () => {
  const key = requestKey()
  const created = await as(customerA, () => order(undefined, key))
  assert.equal(Number(created.total), 36000)
  const retry = await as(customerA, () => order(undefined, key))
  assert.equal(retry.id, created.id)
  const saved = (await db.query('select * from public.orders where id=$1', [created.id])).rows[0]
  assert.equal(saved.status, 'pending')
  assert.equal(saved.payment_status, 'pending')
  assert.equal(saved.customer_id, customerA)
  const lines = (await db.query('select * from public.order_items where order_id=$1', [created.id])).rows
  assert.equal(lines.length, 1)
  assert.equal(Number(lines[0].unit_price), 18000)
  await as(customerA, async () => {
    await assert.rejects(() => order([{ product_id: productA, quantity: 1 }], key), /different order/)
    await assert.rejects(() => db.query('insert into public.orders(shop_id,customer_id,type,payment_method,subtotal,total) values($1,$2,$3,$4,1,1)',
      [shopA, customerA, 'pickup', 'cash']), /permission denied/)
    await assert.rejects(() => db.query('insert into public.order_items(order_id,product_id,quantity,unit_price,subtotal) values($1,$2,1,1,1)',
      [created.id, productA]), /permission denied/)
  })
})

test('forged payloads and invalid products/quantities leave no orders', async () => {
  const beforeCount = (await db.query('select count(*) from public.orders')).rows[0].count
  await as(customerA, async () => {
    for (const items of [[], null, {},
      [{ product_id: productA, quantity: 1, unit_price: 1 }],
      [{ product_id: productA, quantity: 1, payment_status: 'paid' }],
      ...[0, -1, 1.5, 100, '2', null].map((quantity) => [{ product_id: productA, quantity }]),
      [{ product_id: productB, quantity: 1 }], [{ product_id: unavailable, quantity: 1 }],
      [{ product_id: productA, quantity: 1 }, { product_id: productB, quantity: 1 }],
    ]) await assert.rejects(() => order(items))
    await assert.rejects(() => order(undefined, requestKey(), { type: 'delivery' }))
    await assert.rejects(() => order(undefined, requestKey(), { method: 'paid' }))
    await assert.rejects(() => order(undefined, requestKey(), { type: 'dine_in' }))
    await assert.rejects(() => order(undefined, null))
    await assert.rejects(() => order(undefined, requestKey(), { notes: 'x'.repeat(1001) }))
  })
  assert.equal((await db.query('select count(*) from public.orders')).rows[0].count, beforeCount)
})

test('line-item failure rolls back the entire order transaction', async () => {
  await db.exec(`create function public.test_reject_item() returns trigger language plpgsql as $$
    begin raise exception 'Simulated item persistence failure'; end; $$;
    create trigger test_reject_item before insert on public.order_items for each row execute function public.test_reject_item();`)
  const key = requestKey()
  try { await as(customerA, () => assert.rejects(() => order(undefined, key), /Simulated item/)) }
  finally { await db.exec('drop trigger test_reject_item on public.order_items; drop function public.test_reject_item()') }
  assert.equal((await db.query('select id from public.orders where idempotency_key=$1', [key])).rows.length, 0)
  assert.ok((await as(customerA, () => order(undefined, key))).id)
})

test('customer and shop isolation apply to reads and payment writes; staff can verify their own shop', async () => {
  const created = await as(customerA, () => order())
  for (const identity of [customerB, adminB]) await as(identity, async () => {
    assert.equal((await db.query('select id from public.orders where id=$1', [created.id])).rows.length, 0)
    assert.equal((await db.query('select id from public.order_items where order_id=$1', [created.id])).rows.length, 0)
    assert.equal((await db.query("update public.orders set payment_status='paid' where id=$1 returning id", [created.id])).rows.length, 0)
  })
  await as(customerA, async () => assert.equal((await db.query("update public.orders set payment_status='paid' where id=$1 returning id", [created.id])).rows.length, 0))
  await as(staffA, async () => {
    assert.equal((await db.query("update public.orders set payment_status='paid',status='confirmed' where id=$1 returning id", [created.id])).rows.length, 1)
    await assert.rejects(() => db.query('update public.orders set total=1 where id=$1', [created.id]), /permission denied/)
  })
  await as(adminB, async () => assert.equal((await db.query("update public.products set name='Cross shop' where id=$1 returning id", [productA])).rows.length, 0))
  await as(staffA, async () => assert.equal((await db.query("update public.products set name='Staff bypass' where id=$1 returning id", [productA])).rows.length, 0))
  await as(adminA, async () => assert.equal((await db.query("update public.products set name='Admin update' where id=$1 returning id", [productA])).rows.length, 1))
})

test('migration can be reapplied without reopening access', async () => {
  await db.exec(migration)
  const result = await db.query("select has_column_privilege('authenticated','public.users','role','UPDATE') as can_change_role, has_table_privilege('authenticated','public.orders','INSERT') as can_insert_order")
  assert.equal(result.rows[0].can_change_role, false)
  assert.equal(result.rows[0].can_insert_order, false)
})

test('staff verification records actor/time once and rejects unpaid processing or status regression', async () => {
  const created = await as(customerA, () => order())
  await as(staffA, async () => {
    await assert.rejects(() => db.query("update public.orders set status='confirmed' where id=$1", [created.id]), /Verify payment/)
    await db.query("update public.orders set payment_status='paid',status='confirmed' where id=$1", [created.id])
    const first = (await db.query('select payment_confirmed_by,payment_confirmed_at from public.orders where id=$1', [created.id])).rows[0]
    assert.equal(first.payment_confirmed_by, staffA)
    assert.ok(first.payment_confirmed_at)
    await db.query("update public.orders set payment_status='paid',status='confirmed' where id=$1", [created.id])
    const repeated = (await db.query('select payment_confirmed_at from public.orders where id=$1', [created.id])).rows[0]
    assert.equal(String(repeated.payment_confirmed_at), String(first.payment_confirmed_at))
    await assert.rejects(() => db.query("update public.orders set payment_status='pending' where id=$1", [created.id]), /Invalid payment/)
    await assert.rejects(() => db.query("update public.orders set status='completed' where id=$1", [created.id]), /Invalid order/)
    await db.query("update public.orders set status='preparing' where id=$1", [created.id])
    await db.query("update public.orders set status='ready' where id=$1", [created.id])
    await db.query("update public.orders set status='completed' where id=$1", [created.id])
    await assert.rejects(() => db.query("update public.orders set status='ready' where id=$1", [created.id]), /Invalid order/)
  })
})

test('authenticated role with no user claim fails closed', async () => {
  await as(null, async () => {
    await assert.rejects(() => order(), /Authentication required/)
    assert.equal((await db.query('select id from public.users')).rows.length, 0)
    assert.equal((await db.query('select id from public.orders')).rows.length, 0)
  })
})
