-- =============================================================================
-- Migration: 0014_tighten_rls_policies.sql
-- Description: Resolve Supabase Security Advisor Critical Exposures
--              Eliminates broad public read/write permissions on sensitive PII
--              (addresses, applications, bespoke requests, user roles).
--              Enforces service_role backend access.
-- =============================================================================

-- 1. Addresses table: Remove unauthenticated public management
DROP POLICY IF EXISTS "Public can manage own addresses" ON public.addresses;

-- 2. Artisan applications: Public may apply (INSERT), but cannot read other applicants
DROP POLICY IF EXISTS "Public read applications" ON public.artisan_applications;

-- 3. Bespoke requests: Public may submit (INSERT), but cannot read or update other patrons' requests
DROP POLICY IF EXISTS "Allow read access to bespoke_requests" ON public.bespoke_requests;
DROP POLICY IF EXISTS "Allow update access to bespoke_requests" ON public.bespoke_requests;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bespoke_requests' AND policyname = 'Service role full access on bespoke_requests'
  ) THEN
    CREATE POLICY "Service role full access on bespoke_requests"
      ON public.bespoke_requests FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 4. User roles: Registry should never be publicly queryable
DROP POLICY IF EXISTS "Public read user_roles" ON public.user_roles;

-- 5. Products: Disallow generic authenticated users from modifying product catalog directly
DROP POLICY IF EXISTS "Authenticated users can manage products" ON public.products;

-- 6. Orders: Disallow generic authenticated users from querying all orders table-wide
DROP POLICY IF EXISTS "Authenticated users can view orders" ON public.orders;
