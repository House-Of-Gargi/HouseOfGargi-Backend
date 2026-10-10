-- =============================================================================
-- Migration: 0009_payouts_and_audit_logs.sql
-- Description: Financial settlement ledger and Super Admin audit trail
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.artisan_payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payout_reference TEXT NOT NULL UNIQUE,     -- e.g. 'PO-2026-1042'
  artisan_email TEXT NOT NULL,
  gross_amount INTEGER NOT NULL,             -- Total order value (₹)
  platform_commission INTEGER NOT NULL,      -- House of Gargi 15% take-rate (₹)
  net_payout_amount INTEGER NOT NULL,        -- Amount payable to weaver (85%)
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'pending',    -- 'pending', 'approved', 'processed', 'failed'
  authorized_by TEXT,                        -- Super Admin email
  authorized_at TIMESTAMP WITH TIME ZONE,
  bank_transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_artisan_payouts_email ON public.artisan_payouts(artisan_email);
CREATE INDEX IF NOT EXISTS idx_artisan_payouts_status ON public.artisan_payouts(status);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_email TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,                      -- 'APPROVE_ARTISAN', 'CHANGE_ROLE', 'AUTHORIZE_PAYOUT', 'UPDATE_CATEGORY'
  target_resource TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

ALTER TABLE public.artisan_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on artisan_payouts" ON public.artisan_payouts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on audit_logs" ON public.audit_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
