-- =============================================================================
-- Migration: 0008_products_curation_and_inventory.sql
-- Description: Product enhancements for artisan ownership, curation status & sales metrics
-- =============================================================================

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS artisan_email TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS craft_technique TEXT DEFAULT 'Heritage Handloom';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS curation_status TEXT DEFAULT 'approved'; -- 'draft', 'pending_approval', 'approved', 'rejected'
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS total_units_sold INTEGER DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS total_gross_revenue INTEGER DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS loom_lead_time_days INTEGER DEFAULT 0; -- 0 = Ready to Ship

CREATE INDEX IF NOT EXISTS idx_products_curation_status ON public.products(curation_status);
CREATE INDEX IF NOT EXISTS idx_products_artisan_email ON public.products(artisan_email);
CREATE INDEX IF NOT EXISTS idx_products_bestseller ON public.products(is_bestseller);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured);
