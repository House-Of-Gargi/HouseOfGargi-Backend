-- =============================================================================
-- Migration: 0015_clean_categories_and_roles.sql
-- Description: 1. Clean, streamlined category taxonomy matching UI exactly
--              (Sarees, Lehengas, Kurta Sets, Accessories, Bespoke)
--              2. Consolidated authoritative user_roles registry
-- =============================================================================

-- 1. Streamline categories taxonomy (removing extra-ornate or placeholder naming)
INSERT INTO public.categories (id, name, slug, description, image_url, display_order, is_active)
VALUES
  ('sarees', 'Sarees', 'sarees', 'Handloom Banarasi, Kanchipuram, and Paithani silk sarees.', '/images/category-sarees.png', 1, true),
  ('lehengas', 'Lehengas', 'lehengas', 'Hand-embroidered bridal and celebratory royal lehenga sets.', '/images/category-lehengas.png', 2, true),
  ('kurta-sets', 'Kurta Sets', 'kurta-sets', 'Artisan woven Chanderi and Chikankari kurta sets.', '/images/category-kurtas.png', 3, true),
  ('accessories', 'Accessories', 'accessories', 'Handcrafted jewellery, Kundan polki crafts, and stoles.', '/images/category-accessories.png', 4, true),
  ('bespoke', 'Bespoke', 'bespoke', 'Custom commissioned heirloom pieces tailored on loom.', '/images/category-bespoke.png', 5, true)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    display_order = EXCLUDED.display_order,
    is_active = EXCLUDED.is_active,
    updated_at = timezone('utc'::text, now());

-- 2. Consolidate authoritative user roles across all portals
INSERT INTO public.user_roles (user_email, role, assigned_by)
VALUES
  ('tanmaysaaagr@gmail.com', 'super_admin', 'SYSTEM_REGISTRY_MIGRATION'),
  ('tanmaysaagar@gmail.com', 'super_admin', 'SYSTEM_REGISTRY_MIGRATION'),
  ('gargisaha1508@gmail.com', 'super_admin', 'SYSTEM_REGISTRY_MIGRATION'),
  ('shawsumit6286@gmail.com', 'super_admin', 'SYSTEM_REGISTRY_MIGRATION'),
  ('sumitgreat2705@gmail.com', 'admin', 'SYSTEM_REGISTRY_MIGRATION'),
  ('admin@gargisaha.com', 'admin', 'SYSTEM_REGISTRY_MIGRATION'),
  ('curator@gargisaha.com', 'admin', 'SYSTEM_REGISTRY_MIGRATION'),
  ('artisan@gargisaha.com', 'artisan', 'SYSTEM_REGISTRY_MIGRATION'),
  ('team.anga9@gmail.com', 'artisan', 'SYSTEM_REGISTRY_MIGRATION')
ON CONFLICT (user_email) DO UPDATE
SET role = EXCLUDED.role,
    updated_at = timezone('utc'::text, now());
