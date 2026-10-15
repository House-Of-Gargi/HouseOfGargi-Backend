-- ==============================================================================
-- House of Gargi Migration 0017: OTP Single-Use Token Invalidation
-- ==============================================================================
-- Prevents replay attacks by recording cryptographic hashes of used OTP tokens.
-- Verified OTP tokens are recorded and rejected on any subsequent verification attempts.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.otp_used_tokens (
  token_hash text PRIMARY KEY,
  used_at timestamptz NOT NULL DEFAULT now(),
  user_email text
);

-- Index for temporal cleanup queries (e.g., purging records older than 24h)
CREATE INDEX IF NOT EXISTS idx_otp_used_tokens_used_at 
  ON public.otp_used_tokens (used_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.otp_used_tokens ENABLE ROW LEVEL SECURITY;

-- Deny all public and anon access. Only Fastify Backend service_role key can manage used tokens.
DROP POLICY IF EXISTS "Service role full access on otp_used_tokens" ON public.otp_used_tokens;
CREATE POLICY "Service role full access on otp_used_tokens"
  ON public.otp_used_tokens FOR ALL TO service_role USING (true) WITH CHECK (true);
