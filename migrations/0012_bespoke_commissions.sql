-- =============================================================================
-- Migration: 0012_bespoke_commissions.sql
-- Description: Bespoke custom commission requests for Admin & Patron tracking
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.bespoke_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_number TEXT NOT NULL UNIQUE,     -- e.g. 'HG-BESP-749102'
  customer_id TEXT,                         -- Supabase user ID or customer email
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  category TEXT NOT NULL,                   -- Sarees, Lehengas, Kurta Sets, Accessories
  material TEXT,                            -- Preferred fabric / material
  size TEXT,                                -- Measurements / size
  details TEXT NOT NULL,                    -- Commission details & inspiration
  status TEXT NOT NULL DEFAULT 'pending',   -- 'pending', 'contacted', 'in_consultation', 'in_production', 'completed', 'cancelled'
  assigned_artisan TEXT,                    -- Artisan or Guild assigned
  admin_notes TEXT,                         -- Internal curation notes
  reviewed_by TEXT,                         -- Admin email
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bespoke_requests_status ON public.bespoke_requests(status);
CREATE INDEX IF NOT EXISTS idx_bespoke_requests_email ON public.bespoke_requests(email);
CREATE INDEX IF NOT EXISTS idx_bespoke_requests_created_at ON public.bespoke_requests(created_at DESC);

ALTER TABLE public.bespoke_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert to bespoke_requests" 
ON public.bespoke_requests 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow read access to bespoke_requests" 
ON public.bespoke_requests 
FOR SELECT 
USING (true);

CREATE POLICY "Allow update access to bespoke_requests" 
ON public.bespoke_requests 
FOR UPDATE 
USING (true);
