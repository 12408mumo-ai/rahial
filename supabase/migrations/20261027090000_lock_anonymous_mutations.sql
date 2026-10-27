-- CREE WRLD storefront security model
-- Anonymous shoppers may read published catalog data and insert orders only.
-- Product/category changes are reserved for Supabase Dashboard roles using
-- the service role, which bypasses RLS.
--
-- Note: Storage policies on Supabase-managed storage.objects are administered
-- from the Dashboard. This migration intentionally touches only public tables.

-- Remove the legacy permissive product-write policies.
DROP POLICY IF EXISTS "Allow public insert products" ON public.products;
DROP POLICY IF EXISTS "Allow public update products" ON public.products;
DROP POLICY IF EXISTS "Allow public delete products" ON public.products;

-- Clean up any similarly named category policies from earlier iterations.
DROP POLICY IF EXISTS "Allow public insert categories" ON public.categories;
DROP POLICY IF EXISTS "Allow public update categories" ON public.categories;
DROP POLICY IF EXISTS "Allow public delete categories" ON public.categories;

-- Defense in depth: RLS stays on even if a database object is recreated.
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Rebuild the narrow read/insert policies from a known state.
DROP POLICY IF EXISTS "Public can view products" ON public.products;
CREATE POLICY "Public can view products"
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
CREATE POLICY "Public can view categories"
  ON public.categories
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow public order placement" ON public.orders;
CREATE POLICY "Allow public order placement"
  ON public.orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Remove broad table grants left over from the original admin-era schema.
REVOKE ALL ON public.products FROM anon, authenticated, PUBLIC;
REVOKE ALL ON public.categories FROM anon, authenticated, PUBLIC;
REVOKE ALL ON public.admins FROM anon, authenticated, PUBLIC;
REVOKE ALL ON public.order_items FROM anon, authenticated, PUBLIC;
REVOKE ALL ON public.orders FROM anon, authenticated, PUBLIC;

-- Grant exactly the capabilities the public storefront needs.
GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT ON public.orders TO anon, authenticated;
