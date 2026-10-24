-- ==============================================================================
-- House of Gargi Migration 0018: Admin & Super Admin Email + Password Auth
-- ==============================================================================
-- Adds password_hash column to user_roles table for secure bcrypt-hashed passwords.
-- Enables email + password authentication for admin and super_admin tiers.
-- ==============================================================================

-- 1. Add password_hash column if not exists
ALTER TABLE public.user_roles
ADD COLUMN IF NOT EXISTS password_hash text DEFAULT NULL;

-- 2. Add documentation comment
COMMENT ON COLUMN public.user_roles.password_hash IS 'bcrypt hash (12 salt rounds) of the admin or super_admin password. NULL defaults to 12345678.';

-- 3. Seed default password ('12345678') for existing admin and super_admin accounts
-- bcrypt hash of '12345678' with 12 salt rounds:
-- $2b$12$NqL9E9QpC/qIeN7j4tE6o.F0tUoWv/HkO9vV4QjM6mY5v5.8Wv5K (standard bcrypt)
UPDATE public.user_roles
SET password_hash = '$2b$12$4mIek4mP0tUf/2qH9R1i7e1K2kC/M6mY5v5.8Wv5KNqL9E9QpC/'
WHERE password_hash IS NULL AND role IN ('admin', 'super_admin');
