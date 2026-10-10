-- =============================================================================
-- Migration: 0010_assign_super_admin_and_admin_roles.sql
-- Description: Assign Super Admin and Admin privileges:
--              1. tanmaysaaagr@gmail.com (Super Admin)
--              2. tanmaysaagar@gmail.com (Super Admin alias)
--              3. sumitgreat2705@gmail.com (Admin)
-- =============================================================================

INSERT INTO public.user_roles (user_email, role, assigned_by)
VALUES 
  ('tanmaysaaagr@gmail.com', 'super_admin', 'EXECUTIVE_ASSIGNMENT'),
  ('tanmaysaagar@gmail.com', 'super_admin', 'EXECUTIVE_ASSIGNMENT'),
  ('sumitgreat2705@gmail.com', 'admin', 'EXECUTIVE_ASSIGNMENT')
ON CONFLICT (user_email) DO UPDATE 
SET role = EXCLUDED.role,
    updated_at = timezone('utc'::text, now());
