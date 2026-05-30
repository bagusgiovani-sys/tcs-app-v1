-- ============================================================
-- RLS PATCH v2 — Run in Supabase SQL Editor
-- Adds: admin/staff write policies, missing SELECT policies,
--       new-user trigger, storage policies
-- ============================================================

-- ============================================================
-- HELPER: reusable role check function
-- ============================================================
CREATE OR REPLACE FUNCTION is_staff_or_admin(shop uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'staff')
      AND users.org_id = shop
  );
$$;

-- ============================================================
-- PRODUCTS — public browse + admin/staff full access
-- ============================================================

-- Allow anyone (anon + authenticated) to view available products
CREATE POLICY "Public can view available products"
  ON products FOR SELECT
  USING (is_available = true);

-- Allow admin/staff to view ALL products (including unavailable)
CREATE POLICY "Staff can view all shop products"
  ON products FOR SELECT
  USING (is_staff_or_admin(shop_id));

-- Allow admin/staff to add products
CREATE POLICY "Staff can insert products"
  ON products FOR INSERT
  WITH CHECK (is_staff_or_admin(shop_id));

-- Allow admin/staff to update products
CREATE POLICY "Staff can update products"
  ON products FOR UPDATE
  USING (is_staff_or_admin(shop_id))
  WITH CHECK (is_staff_or_admin(shop_id));

-- Allow admin/staff to delete products
CREATE POLICY "Staff can delete products"
  ON products FOR DELETE
  USING (is_staff_or_admin(shop_id));

-- ============================================================
-- ORDERS — admin/staff can view and manage all orders in shop
-- ============================================================

-- Allow admin/staff to view all orders for their shop
CREATE POLICY "Staff can view all shop orders"
  ON orders FOR SELECT
  USING (is_staff_or_admin(shop_id));

-- Allow admin/staff to update order status
CREATE POLICY "Staff can update order status"
  ON orders FOR UPDATE
  USING (is_staff_or_admin(shop_id))
  WITH CHECK (is_staff_or_admin(shop_id));

-- Allow staff to create orders at POS (customer_id = staff uid is fine for POS)
CREATE POLICY "Staff can insert orders at POS"
  ON orders FOR INSERT
  WITH CHECK (is_staff_or_admin(shop_id));

-- ============================================================
-- ORDER ITEMS — admin/staff can view all items for their shop
-- ============================================================

CREATE POLICY "Staff can view all order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND is_staff_or_admin(orders.shop_id)
    )
  );

-- Allow staff to insert order items (POS)
CREATE POLICY "Staff can insert order items"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND is_staff_or_admin(orders.shop_id)
    )
  );

-- ============================================================
-- LOYALTY — admin can view all loyalty data for their shop
-- ============================================================

CREATE POLICY "Staff can view shop loyalty points"
  ON loyalty_points FOR SELECT
  USING (is_staff_or_admin(shop_id));

CREATE POLICY "Staff can manage loyalty points"
  ON loyalty_points FOR ALL
  USING (is_staff_or_admin(shop_id))
  WITH CHECK (is_staff_or_admin(shop_id));

CREATE POLICY "Staff can view shop loyalty transactions"
  ON loyalty_transactions FOR SELECT
  USING (is_staff_or_admin(shop_id));

CREATE POLICY "Staff can insert loyalty transactions"
  ON loyalty_transactions FOR INSERT
  WITH CHECK (is_staff_or_admin(shop_id));

-- ============================================================
-- VOUCHERS — admin can manage vouchers for their shop
-- ============================================================

CREATE POLICY "Staff can manage vouchers"
  ON vouchers FOR ALL
  USING (is_staff_or_admin(shop_id))
  WITH CHECK (is_staff_or_admin(shop_id));

-- ============================================================
-- USERS — admin can view all users in their org
-- ============================================================

CREATE POLICY "Admin can view org users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users AS me
      WHERE me.id = auth.uid()
        AND me.role = 'admin'
        AND me.org_id = users.org_id
    )
  );

-- Allow user row creation (needed for new-user trigger)
CREATE POLICY "Service role can insert users"
  ON users FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- NEW-USER TRIGGER
-- Auto-creates a row in public.users when someone signs up.
-- MUST be run so that role-based middleware works correctly.
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, role, name, email)
  VALUES (
    NEW.id,
    'customer',
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- STORAGE — product-images bucket policies
-- Run AFTER creating the bucket in Supabase Storage dashboard:
--   Storage → New bucket → Name: "product-images" → Public: ON
-- ============================================================

-- Allow anyone to read public images
CREATE POLICY "Public can read product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Allow authenticated admin/staff to upload images
CREATE POLICY "Staff can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'staff')
    )
  );

-- Allow staff to replace existing images
CREATE POLICY "Staff can update product images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images'
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'staff')
    )
  );

-- Allow staff to delete images
CREATE POLICY "Staff can delete product images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'staff')
    )
  );
