-- =============================================================================
-- Migration: 0011_admin_super_admin_portal_rbac_enforcement.sql
-- Description: Strict separation of Admin vs Super Admin accounts,
--              re-verifying user_roles uniqueness and allowing artisan registrations.
-- =============================================================================

-- 1. Ensure user_email unique constraint is active on user_roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_roles_user_email_key' 
      AND conrelid = 'public.user_roles'::regclass
  ) THEN
    ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_email_key UNIQUE (user_email);
  END IF;
END $$;

-- 2. Guarantee strict mutually exclusive assignments:
-- Super Admin CANNOT be normal Admin, and Admin CANNOT be Super Admin.
-- tanmaysaaagr@gmail.com -> super_admin only
-- tanmaysaagar@gmail.com -> super_admin only
-- sumitgreat2705@gmail.com -> admin only
INSERT INTO public.user_roles (user_email, role, assigned_by)
VALUES 
  ('tanmaysaaagr@gmail.com', 'super_admin', 'EXECUTIVE_REGISTRY_MIGRATION'),
  ('tanmaysaagar@gmail.com', 'super_admin', 'EXECUTIVE_REGISTRY_MIGRATION'),
  ('sumitgreat2705@gmail.com', 'admin', 'EXECUTIVE_REGISTRY_MIGRATION')
ON CONFLICT (user_email) DO UPDATE 
SET role = EXCLUDED.role,
    updated_at = timezone('utc'::text, now());

-- 3. Both Admin and Super Admin may also have rows in artisan_profiles
-- (verified by checking existence of user_email in artisan_profiles without mutating user_roles)
COMMENT ON TABLE public.user_roles IS 'Primary administrative and executive authority table. Mutually exclusive roles enforced by unique email key.';
