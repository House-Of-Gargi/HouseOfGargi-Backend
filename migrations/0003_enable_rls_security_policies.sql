-- =========================================================================
-- Migration: 0003_enable_rls_security_policies.sql
-- Description: Resolve Supabase Security Advisor Critical Warnings
--              Enables Row Level Security (RLS) on products & orders
-- =========================================================================

-- 1. Enable Row Level Security (RLS) on both tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------------
-- 2. Policies for `public.products`
-- -------------------------------------------------------------------------

-- Clean up any prior policies
DROP POLICY IF EXISTS "Public can view products" ON public.products;
DROP POLICY IF EXISTS "Service role full access on products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can manage products" ON public.products;

-- Allow anyone (public & anonymous patrons) to read products
CREATE POLICY "Public can view products"
ON public.products
FOR SELECT
TO public
USING (true);

-- Allow service_role (Fastify backend) full management
CREATE POLICY "Service role full access on products"
ON public.products
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow authenticated atelier admins/sellers to manage products
CREATE POLICY "Authenticated users can manage products"
ON public.products
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- -------------------------------------------------------------------------
-- 3. Policies for `public.orders`
-- -------------------------------------------------------------------------

-- Clean up any prior policies
DROP POLICY IF EXISTS "Allow placing orders" ON public.orders;
DROP POLICY IF EXISTS "Service role full access on orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can view orders" ON public.orders;

-- Allow patrons and checkout sessions to create orders
CREATE POLICY "Allow placing orders"
ON public.orders
FOR INSERT
TO public
WITH CHECK (true);

-- Allow service_role (Fastify backend) full management
CREATE POLICY "Service role full access on orders"
ON public.orders
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow authenticated users/admins to view orders
CREATE POLICY "Authenticated users can view orders"
ON public.orders
FOR SELECT
TO authenticated
USING (true);
