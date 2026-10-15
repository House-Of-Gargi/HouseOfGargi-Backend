-- =============================================================================
-- Migration: 0016_products_lifecycle_columns.sql
-- Description: Adds lifecycle columns for real-time visibility, stock control,
--              artisan association, and dynamic ranking backfilling.
-- =============================================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS slug             text UNIQUE,
  ADD COLUMN IF NOT EXISTS product_number   text UNIQUE,
  ADD COLUMN IF NOT EXISTS artisan_email    text,
  ADD COLUMN IF NOT EXISTS stock            integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS is_hidden        boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at       timestamptz,
  ADD COLUMN IF NOT EXISTS total_units_sold integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS curation_rank    integer,
  ADD COLUMN IF NOT EXISTS created_at       timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at       timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_products_visible
  ON public.products (created_at DESC) WHERE is_hidden = false AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_bestsellers
  ON public.products (total_units_sold DESC, curation_rank ASC) WHERE is_hidden = false AND deleted_at IS NULL;

-- Public may only view non-hidden, non-deleted creations
DROP POLICY IF EXISTS "Public can view products" ON public.products;
CREATE POLICY "Public can view visible products" ON public.products
  FOR SELECT TO public USING (is_hidden = false AND deleted_at IS NULL);

-- Service role has unrestricted administrative access
DROP POLICY IF EXISTS "Service role full access on products" ON public.products;
CREATE POLICY "Service role full access on products" ON public.products
  FOR ALL TO service_role USING (true) WITH CHECK (true);
