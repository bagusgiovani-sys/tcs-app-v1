# Database Schema — TCS Coffee

## Table Creation Order (run in this exact order — FK constraints)
```
1. organizations
2. users               (FK → organizations)
3. products            (FK → organizations)
4. vouchers            (FK → organizations) ← MUST be before orders
5. orders              (FK → organizations, users, vouchers)
6. order_items         (FK → orders, products)
7. loyalty_points      (FK → users, organizations)
8. loyalty_transactions(FK → users, organizations, orders)
9. voucher_uses        (FK → vouchers, users, orders)
10. wholesale_products  (FK → organizations) B2B — no UI
11. b2b_orders          (FK → organizations) B2B — no UI
12. b2b_order_items     (FK → b2b_orders, wholesale_products) B2B
13. shop_roastery_rel   (FK → organizations) B2B
```

## Root Entity
```sql
organizations: id uuid PK, type text ('shop'|'roastery'), name, slug UNIQUE, address, city, logo_url, created_at
```

## B2C MVP Tables

```sql
users: id uuid PK, org_id FK→organizations (NULL for customers), role ('customer'|'staff'|'admin'), name, email UNIQUE, phone, avatar_url, created_at

products: id uuid PK, shop_id FK→organizations, name, description, price numeric(10,2), category ('coffee'|'non-coffee'|'food'|'merchandise'), image_url, is_available bool DEFAULT true, sort_order int DEFAULT 0, created_at

vouchers: id uuid PK, shop_id FK→organizations, code UNIQUE, name, discount_type ('percentage'|'fixed'), value numeric(10,2), min_order numeric(10,2) DEFAULT 0, max_uses int (NULL=unlimited), used_count int DEFAULT 0, is_active bool DEFAULT true, expires_at timestamptz (nullable), created_at

orders: id uuid PK, shop_id FK→organizations, customer_id FK→users, type ('pickup'|'dine_in'), table_number (nullable), status ('pending'|'confirmed'|'preparing'|'ready'|'completed'|'cancelled'), payment_method ('qris'|'gopay'|'ovo'|'va'|'cash'), payment_status ('pending'|'paid'), subtotal numeric(10,2), discount numeric(10,2) DEFAULT 0, total numeric(10,2), notes, voucher_id FK→vouchers (nullable), created_at, updated_at
-- TRIGGER: CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
-- CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

order_items: id uuid PK, order_id FK→orders, product_id FK→products, quantity int, unit_price numeric(10,2) (SNAPSHOT — not live price), subtotal numeric(10,2), notes, created_at

loyalty_points: id uuid PK, customer_id FK→users, shop_id FK→organizations, points int DEFAULT 0, created_at, updated_at, UNIQUE(customer_id, shop_id)
-- TRIGGER: CREATE TRIGGER loyalty_points_updated_at BEFORE UPDATE ON loyalty_points FOR EACH ROW EXECUTE FUNCTION update_updated_at();

loyalty_transactions: id uuid PK, customer_id FK→users, shop_id FK→organizations, order_id FK→orders (nullable), points int (positive=earn, negative=redeem), type ('earn'|'redeem'|'expire'|'manual'), note, created_at

voucher_uses: id uuid PK, voucher_id FK→vouchers, customer_id FK→users, order_id FK→orders, used_at
```

## B2B Tables (create now, zero UI in MVP)
```sql
wholesale_products: id uuid PK, roastery_id FK→organizations, name, description, unit ('kg'|'g'|'bag'), price_per_unit numeric(10,2), min_qty int, stock_qty int, category ('green_bean'|'roasted_bean'|'syrup'|'equipment'), image_url, is_available bool, created_at

b2b_orders: id uuid PK, buyer_shop_id FK→organizations, seller_roastery_id FK→organizations, status ('pending'|'confirmed'|'processing'|'shipped'|'delivered'|'cancelled'), payment_terms ('immediate'|'net_7'|'net_30'), payment_status ('unpaid'|'partial'|'paid'), total numeric(10,2), notes, created_at

b2b_order_items: id uuid PK, b2b_order_id FK→b2b_orders, product_id FK→wholesale_products, quantity int, unit_price numeric(10,2), subtotal numeric(10,2), created_at

shop_roastery_rel: id uuid PK, shop_id FK→organizations, roastery_id FK→organizations, pricing_tier DEFAULT 'standard', credit_limit numeric(10,2) DEFAULT 0, is_active bool DEFAULT true, created_at, UNIQUE(shop_id, roastery_id)
```

## RLS Rules
- Enable RLS on every table with `shop_id`
- Public: SELECT on `products` and `organizations` (menu browsing without login)
- Customer: SELECT own orders/loyalty only
- Staff/Admin: full access for their `org_id`
- Never expose other shops' data

## Supabase Clients
```typescript
// server.ts — Server Components, Server Actions, Route Handlers
import { createServerClient } from '@supabase/ssr'
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(URL, ANON_KEY, {
    cookies: { getAll: () => cookieStore.getAll(), setAll: (cs) => cs.forEach(({name,value,options}) => cookieStore.set(name,value,options)) }
  })
}
// client.ts — Client Components only
import { createBrowserClient } from '@supabase/ssr'
export const createClient = () => createBrowserClient(URL, ANON_KEY)
```

Always filter: `.eq('shop_id', SHOP_ID)`. Never query without shop scope.
Type gen: `npx supabase login` then `npx supabase gen types typescript --project-id ID > lib/supabase/types.ts`
Images: bucket `product-images`, path `products/{shop_id}/{product_id}.webp`, public.
