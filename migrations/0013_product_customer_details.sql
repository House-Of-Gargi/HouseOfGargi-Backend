-- =============================================================================
-- Migration: 0013_product_customer_details.sql
-- Description: Expand products table with customer-facing couture specifications (description, fabric, region, occasion, etc.)
-- =============================================================================

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS fabric TEXT DEFAULT 'Pure Mulberry Silk';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS region TEXT DEFAULT 'India';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS occasion TEXT DEFAULT 'Wedding & Festive';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sizes TEXT[] DEFAULT ARRAY['Free Size'];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS care TEXT DEFAULT 'Dry clean only';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images TEXT[];

-- Update existing products with descriptive text where missing
UPDATE public.products 
SET description = name || ' handcrafted with traditional artisanal techniques and pure silk weaving.'
WHERE description IS NULL OR description = '';
