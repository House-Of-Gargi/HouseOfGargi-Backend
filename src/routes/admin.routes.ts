import { FastifyPluginAsync } from 'fastify';
import { supabase } from '../db/supabase.js';

export const adminRoutes: FastifyPluginAsync = async (fastify) => {
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
    return reply.send({
      success: true,
      pendingCuration: [
        {
          id: 'qc-01',
          name: 'Varanasi Shikargah Animal Motif Katan Saree',
          artisan: 'Ramdas Mishra Pit Loom Guild',
          price: 36000,
          status: 'pending',
        },
        {
          id: 'qc-02',
          name: 'Korvai Peacock Border Contrast Saree',
          artisan: 'Sundaramurthy Chettiar',
          price: 29500,
          status: 'pending',
        },
      ],
    });
  });
};
