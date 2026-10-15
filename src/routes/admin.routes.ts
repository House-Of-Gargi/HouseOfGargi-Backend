import { FastifyPluginAsync } from 'fastify';
import { supabase } from '../db/supabase.js';

export const adminRoutes: FastifyPluginAsync = async (fastify) => {
  // Enforce admin or super_admin role on all admin routes
  fastify.addHook('preHandler', fastify.requireRole('admin', 'super_admin'));

  // GET /api/v1/admin/applications (Artisan Questionnaires)
  fastify.get('/applications', async (request, reply) => {
    try {
      const { data, error } = await supabase
        .from('artisan_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return reply.send({ success: true, applications: [] });
      }

      return reply.send({ success: true, count: data?.length || 0, applications: data || [] });
    } catch {
      return reply.send({ success: true, applications: [] });
    }
  });

  // PATCH /api/v1/admin/applications/:id/status
  fastify.patch<{ Params: { id: string }; Body: { status: string; reviewNotes?: string; adminEmail?: string } }>(
    '/applications/:id/status',
    async (request, reply) => {
      const { id } = request.params;
      const { status, reviewNotes, adminEmail = 'admin@gargisaha.com' } = request.body;

      try {
        const { data, error } = await supabase
          .from('artisan_applications')
          .update({
            status,
            reviewed_by: adminEmail,
            review_notes: reviewNotes || '',
            updated_at: new Date().toISOString(),
          })
          .eq('application_number', id)
          .select()
          .single();

        if (error) {
          return reply.status(400).send({ success: false, message: error.message });
        }

        // If approved, promote user to artisan in user_roles
        if (status === 'approved' && data?.email) {
          await supabase.from('user_roles').upsert({
            user_email: data.email,
            role: 'artisan',
            assigned_by: adminEmail,
            updated_at: new Date().toISOString(),
          });
        }

        return reply.send({ success: true, application: data });
      } catch (err: any) {
        return reply.status(500).send({ success: false, message: err.message });
      }
    }
  );

  // GET /api/v1/admin/products/approvals
  fastify.get('/products/approvals', async (_request, reply) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_hidden', true)
        .order('created_at', { ascending: false });

      if (error) {
        return reply.status(500).send({ success: false, message: error.message });
      }

      const pendingCuration = (data || []).map((p: any) => ({
        id: String(p.id),
        name: p.name,
        artisan: p.artisan_note || p.artisanNote || 'Master Weaver Guild',
        price: p.price_in_rupees || p.price || 0,
        status: 'pending',
      }));

      return reply.send({
        success: true,
        count: pendingCuration.length,
        pendingCuration,
      });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err?.message || 'Failed to fetch curation approvals.' });
    }
  });
};
