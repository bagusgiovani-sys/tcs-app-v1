-- ============================================================
-- TCS Coffee — Full Schema
-- Run this ENTIRE block in Supabase SQL Editor (once)
-- ============================================================

-- Shared updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. organizations
-- ============================================================
CREATE TABLE organizations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type       text NOT NULL CHECK (type IN ('shop', 'roastery')),
  name       text NOT NULL,
  slug       text NOT NULL UNIQUE,
  address    text,
  city       text,
  logo_url   text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. users  (our profile table — mirrors auth.users)
-- ============================================================
CREATE TABLE users (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id     uuid REFERENCES organizations(id),
  role       text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'staff', 'admin')),
  name       text,
  email      text UNIQUE,
  phone      text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. products
-- ============================================================
CREATE TABLE products (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id      uuid NOT NULL REFERENCES organizations(id),
  name         text NOT NULL,
  description  text,
  price        numeric(10,2) NOT NULL,
  category     text NOT NULL CHECK (category IN ('coffee', 'non-coffee', 'food', 'merchandise')),
  image_url    text,
  is_available boolean NOT NULL DEFAULT true,
  sort_order   int NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. vouchers  (MUST be before orders)
-- ============================================================
CREATE TABLE vouchers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id       uuid NOT NULL REFERENCES organizations(id),
  code          text NOT NULL UNIQUE,
  name          text NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  value         numeric(10,2) NOT NULL,
  min_order     numeric(10,2) NOT NULL DEFAULT 0,
  max_uses      int,
  used_count    int NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  expires_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. orders
-- ============================================================
CREATE TABLE orders (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id        uuid NOT NULL REFERENCES organizations(id),
  customer_id    uuid NOT NULL REFERENCES users(id),
  type           text NOT NULL CHECK (type IN ('pickup', 'dine_in')),
  table_number   text,
  status         text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','preparing','ready','completed','cancelled')),
  payment_method text NOT NULL CHECK (payment_method IN ('qris','gopay','ovo','va','cash')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid')),
  subtotal       numeric(10,2) NOT NULL,
  discount       numeric(10,2) NOT NULL DEFAULT 0,
  total          numeric(10,2) NOT NULL,
  notes          text,
  voucher_id     uuid REFERENCES vouchers(id),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 6. order_items
-- ============================================================
CREATE TABLE order_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  uuid NOT NULL REFERENCES products(id),
  quantity    int NOT NULL,
  unit_price  numeric(10,2) NOT NULL, -- snapshot — not live price
  subtotal    numeric(10,2) NOT NULL,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 7. loyalty_points
-- ============================================================
CREATE TABLE loyalty_points (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES users(id),
  shop_id     uuid NOT NULL REFERENCES organizations(id),
  points      int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (customer_id, shop_id)
);

CREATE TRIGGER loyalty_points_updated_at
  BEFORE UPDATE ON loyalty_points
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 8. loyalty_transactions
-- ============================================================
CREATE TABLE loyalty_transactions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES users(id),
  shop_id     uuid NOT NULL REFERENCES organizations(id),
  order_id    uuid REFERENCES orders(id),
  points      int NOT NULL, -- positive = earn, negative = redeem
  type        text NOT NULL CHECK (type IN ('earn','redeem','expire','manual')),
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 9. voucher_uses
-- ============================================================
CREATE TABLE voucher_uses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id  uuid NOT NULL REFERENCES vouchers(id),
  customer_id uuid NOT NULL REFERENCES users(id),
  order_id    uuid NOT NULL REFERENCES orders(id),
  used_at     timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 10. wholesale_products  (B2B — create now, zero UI in MVP)
-- ============================================================
CREATE TABLE wholesale_products (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roastery_id   uuid NOT NULL REFERENCES organizations(id),
  name          text NOT NULL,
  description   text,
  unit          text NOT NULL CHECK (unit IN ('kg','g','bag')),
  price_per_unit numeric(10,2) NOT NULL,
  min_qty       int NOT NULL,
  stock_qty     int NOT NULL,
  category      text NOT NULL CHECK (category IN ('green_bean','roasted_bean','syrup','equipment')),
  image_url     text,
  is_available  boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 11. b2b_orders  (B2B — create now, zero UI in MVP)
-- ============================================================
CREATE TABLE b2b_orders (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_shop_id      uuid NOT NULL REFERENCES organizations(id),
  seller_roastery_id uuid NOT NULL REFERENCES organizations(id),
  status             text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled')),
  payment_terms      text NOT NULL CHECK (payment_terms IN ('immediate','net_7','net_30')),
  payment_status     text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','partial','paid')),
  total              numeric(10,2) NOT NULL,
  notes              text,
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 12. b2b_order_items  (B2B)
-- ============================================================
CREATE TABLE b2b_order_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  b2b_order_id uuid NOT NULL REFERENCES b2b_orders(id) ON DELETE CASCADE,
  product_id   uuid NOT NULL REFERENCES wholesale_products(id),
  quantity     int NOT NULL,
  unit_price   numeric(10,2) NOT NULL,
  subtotal     numeric(10,2) NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 13. shop_roastery_rel  (B2B)
-- ============================================================
CREATE TABLE shop_roastery_rel (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id       uuid NOT NULL REFERENCES organizations(id),
  roastery_id   uuid NOT NULL REFERENCES organizations(id),
  pricing_tier  text NOT NULL DEFAULT 'standard',
  credit_limit  numeric(10,2) NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shop_id, roastery_id)
);

-- ============================================================
-- RLS — enable on every table
-- ============================================================
ALTER TABLE organizations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE products             ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders               ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points       ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_uses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE wholesale_products   ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_orders           ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_order_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_roastery_rel    ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies — public read for menu browsing
-- ============================================================
CREATE POLICY "Public can view organizations"
  ON organizations FOR SELECT USING (true);

CREATE POLICY "Public can view available products"
  ON products FOR SELECT USING (is_available = true);

-- ============================================================
-- RLS Policies — authenticated customers
-- ============================================================
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Customers can view own orders"
  ON orders FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Customers can insert orders"
  ON orders FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can view own order items"
  ON order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid()
  ));

CREATE POLICY "Customers can insert order items"
  ON order_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid()
  ));

CREATE POLICY "Customers can view own loyalty points"
  ON loyalty_points FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Customers can view own loyalty transactions"
  ON loyalty_transactions FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Public can view active vouchers"
  ON vouchers FOR SELECT USING (is_active = true);
