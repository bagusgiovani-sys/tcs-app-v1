-- Fix: products table missing public SELECT policy
-- Run this once in Supabase SQL Editor → the home page will immediately show products

CREATE POLICY "Public can view available products"
  ON products FOR SELECT
  USING (is_available = true);
