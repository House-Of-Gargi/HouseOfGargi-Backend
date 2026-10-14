-- =============================================================================
-- Migration: 0013_product_customer_details.sql
-- Description: Expand products table with customer-facing couture specifications
-- Standard Categories: 'sarees', 'lehengas', 'kurta-sets', 'accessories'
-- =============================================================================

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS craft_technique TEXT DEFAULT 'Handloom Weave';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS fabric TEXT DEFAULT 'Pure Silk';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS region TEXT DEFAULT 'India';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS occasion TEXT DEFAULT 'Wedding & Festive';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sizes TEXT[] DEFAULT ARRAY['Free Size'];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS care TEXT DEFAULT 'Dry clean only';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images TEXT[];

-- Standardize categories to simple canonical keys: sarees, lehengas, kurta-sets, accessories
UPDATE public.products
SET category = 'sarees'
WHERE category ILIKE '%saree%';

UPDATE public.products
SET category = 'lehengas'
WHERE category ILIKE '%lehenga%';

UPDATE public.products
SET category = 'kurta-sets'
WHERE category ILIKE '%kurta%';

UPDATE public.products
SET category = 'accessories'
WHERE category ILIKE '%accessor%' OR category ILIKE '%jewel%';

-- Update existing products with descriptive text where missing
UPDATE public.products 
SET description = name || ' handcrafted with traditional artisanal techniques and pure silk weaving.'
WHERE description IS NULL OR description = '';
