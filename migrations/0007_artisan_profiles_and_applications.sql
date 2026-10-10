-- =============================================================================
-- Migration: 0007_artisan_profiles_and_applications.sql
-- Description: Artisan workshop profiles and application questionnaires (Admin reviewed)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.artisan_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  guild_name TEXT,
  craft_specialty TEXT NOT NULL,
  region TEXT NOT NULL,
  lineage_story TEXT,
  experience_years INTEGER DEFAULT 10,
  workshop_address TEXT,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_ifsc_code TEXT,
  bank_account_holder TEXT,
  commission_rate_percent NUMERIC(5,2) DEFAULT 15.00,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  child_labor_agreement_signed BOOLEAN DEFAULT false,
  child_labor_signed_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Artisan application questionnaires submitted via /seller/apply
CREATE TABLE IF NOT EXISTS public.artisan_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_number TEXT NOT NULL UNIQUE,   -- e.g. 'HG-ART-829104'
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  dob DATE,
  age INTEGER,
  gender TEXT,
  state TEXT NOT NULL,
  place_of_birth TEXT,
  type_of_art TEXT NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb, -- All 14 answers from questionnaire
  agreed_child_labor BOOLEAN NOT NULL DEFAULT false,
  agreed_inspection BOOLEAN NOT NULL DEFAULT false,
  signature TEXT NOT NULL,
  signature_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',    -- 'pending', 'under_review', 'approved', 'rejected'
  reviewed_by TEXT,                          -- Admin email who reviewed the submission
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_artisan_applications_status ON public.artisan_applications(status);
CREATE INDEX IF NOT EXISTS idx_artisan_applications_email ON public.artisan_applications(email);

ALTER TABLE public.artisan_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artisan_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert applications" ON public.artisan_applications FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public read applications" ON public.artisan_applications FOR SELECT TO public USING (true);
CREATE POLICY "Public read profiles" ON public.artisan_profiles FOR SELECT TO public USING (true);
CREATE POLICY "Service role full access on profiles" ON public.artisan_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on applications" ON public.artisan_applications FOR ALL TO service_role USING (true) WITH CHECK (true);
