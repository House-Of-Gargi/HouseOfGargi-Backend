-- =========================================================================
-- Migration 0019: Set 9876543210 as Master Artisan Gopal Chandra Dey's Phone
-- House of Gargi Artisan Registry & Fixed Phone Login Enforcement
-- =========================================================================

-- 1. Update Gopal Chandra Dey's official contact in artisan_applications
UPDATE public.artisan_applications
SET 
  phone = '+91 98765 43210',
  updated_at = NOW()
WHERE application_number = 'HG-ART-260501' OR email = 'team.anga9@gmail.com';

-- 2. Update or insert into artisan_profiles if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'artisan_profiles') THEN
    UPDATE public.artisan_profiles
    SET phone = '+91 98765 43210', updated_at = NOW()
    WHERE user_email = 'team.anga9@gmail.com';
  END IF;
END $$;

-- 3. Verify user_roles has active artisan authority for team.anga9@gmail.com
INSERT INTO public.user_roles (user_email, role, assigned_by, created_at, updated_at)
VALUES ('team.anga9@gmail.com', 'artisan', 'MIGRATION_0019_PHONE_REGISTRY', NOW(), NOW())
ON CONFLICT (user_email) 
DO UPDATE SET role = 'artisan', updated_at = NOW();

