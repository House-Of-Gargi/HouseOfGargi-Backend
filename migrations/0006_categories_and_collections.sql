-- =============================================================================
-- Migration: 0006_categories_and_collections.sql
-- Description: Dynamic categories & collections managed by Super Admin
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,                       -- e.g. 'sarees', 'lehengas'
  name TEXT NOT NULL,                        -- e.g. 'Royal Sarees'
  sanskrit_lipi TEXT,                        -- e.g. 'गार्गी सूत्रम्'
  slug TEXT NOT NULL UNIQUE,                 -- e.g. 'sarees'
  description TEXT,
  image_url TEXT NOT NULL,
  banner_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed core luxury collections
INSERT INTO public.categories (id, name, sanskrit_lipi, slug, image_url, display_order)
VALUES
  ('sarees', 'Royal Sarees', 'गार्गी सूत्रम्', 'sarees', '/images/category-sarees.png', 1),
  ('lehengas', 'Bridal Lehengas', 'राज दरबार', 'lehengas', '/images/category-lehengas.png', 2),
  ('kurta-sets', 'Heritage Kurta Sets', 'पवিত্র परम्परा', 'kurta-sets', '/images/category-kurtas.png', 3),
  ('accessories', 'Courtly Jewellery', 'শৃঙ্গার অলঙ্কার', 'accessories', '/images/category-accessories.png', 4),
  ('bespoke', 'Bespoke Atelier Trousseau', 'রাজকীয় সৃষ্টি', 'bespoke', '/images/category-bespoke.png', 5)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active categories" ON public.categories FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Service role full access on categories" ON public.categories FOR ALL TO service_role USING (true) WITH CHECK (true);
