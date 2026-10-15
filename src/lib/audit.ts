import type { FastifyRequest } from 'fastify';
import { supabase } from '../db/supabase.js';

export interface AuditLogPayload {
  action: string;
  targetResource: string;
  details?: Record<string, any>;
}

export async function recordAuditLog(
  req: FastifyRequest,
  action: string,
  targetResource: string,
  details: Record<string, any> = {}
): Promise<void> {
  try {
    const user = req.user as { email?: string; role?: string } | undefined;
    const actorEmail = user?.email || (req.headers['x-actor-email'] as string) || 'system@gargisaha.com';
    const actorRole = user?.role || 'admin';
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';

    await supabase.from('audit_logs').insert({
      actor_email: actorEmail,
      actor_role: actorRole,
      action,
      target_resource: targetResource,
      details,
      ip_address: typeof ipAddress === 'string' ? ipAddress : String(ipAddress),
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    req.log.warn({ err }, '[Audit Log] Failed to record audit log entry');
  }
}
