-- =============================================================================
-- Migration: 0005_roles_and_permissions.sql
-- Description: Core RBAC Role definitions & user_roles table
-- =============================================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('patron', 'artisan', 'admin', 'super_admin');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL UNIQUE,
  role public.app_role NOT NULL DEFAULT 'patron',
  assigned_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed initial privileged accounts
INSERT INTO public.user_roles (user_email, role, assigned_by)
VALUES 
  ('gargisaha1508@gmail.com', 'super_admin', 'SYSTEM_SEED'),
  ('shawsumit6286@gmail.com', 'super_admin', 'SYSTEM_SEED'),
  ('admin@gargisaha.com', 'admin', 'SYSTEM_SEED'),
  ('curator@gargisaha.com', 'admin', 'SYSTEM_SEED'),
  ('artisan@gargisaha.com', 'artisan', 'SYSTEM_SEED')
ON CONFLICT (user_email) DO UPDATE 
SET role = EXCLUDED.role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read user_roles" ON public.user_roles FOR SELECT TO public USING (true);
CREATE POLICY "Service role full access on user_roles" ON public.user_roles FOR ALL TO service_role USING (true) WITH CHECK (true);
