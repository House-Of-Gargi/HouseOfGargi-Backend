import { FastifyPluginAsync } from 'fastify';
import { supabase } from '../db/supabase.js';
import { recordAuditLog } from '../lib/audit.js';
import { invalidateCatalogCache } from '../services/catalog.service.js';

export const adminRoutes: FastifyPluginAsync = async (fastify) => {
  // Enforce admin or super_admin role on all admin routes
  fastify.addHook('preHandler', fastify.requireRole('admin', 'super_admin'));

  // ==========================================
  // 1. DASHBOARD & METRICS
  // ==========================================
  fastify.get('/dashboard', async (_request, reply) => {
    try {
      const [
        { count: totalProducts },
        { count: liveProducts },
        { count: hiddenProducts },
        { count: pendingApplications },
        { count: pendingBespoke },
        { count: totalArtisans },
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('products').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('is_hidden', false),
        supabase.from('products').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('is_hidden', true),
        supabase.from('artisan_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('bespoke_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('artisan_profiles').select('*', { count: 'exact', head: true }),
      ]);

      return reply.send({
        success: true,
        metrics: {
          totalProducts: totalProducts || 0,
          liveProducts: liveProducts || 0,
          hiddenProducts: hiddenProducts || 0,
          pendingApplications: pendingApplications || 0,
          pendingBespoke: pendingBespoke || 0,
          totalArtisans: totalArtisans || 0,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err?.message || 'Dashboard telemetry failure' });
    }
  });

  // ==========================================
  // 2. PRODUCT MANAGEMENT (CRUD & VISIBILITY)
  // ==========================================
  // GET /api/v1/admin/products
  fastify.get<{
    Querystring: { category?: string; search?: string; page?: string; limit?: string; includeHidden?: string };
  }>('/products', async (request, reply) => {
    try {
      const { category, search, page = '1', limit = '50', includeHidden = 'true' } = request.query;
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
      const offset = (pageNum - 1) * limitNum;

      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .is('deleted_at', null);

      if (includeHidden === 'false') {
        query = query.eq('is_hidden', false);
      }
      if (category) {
        query = query.eq('category', category.toLowerCase().trim());
      }
      if (search) {
        const q = search.trim();
        query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%,product_number.ilike.%${q}%`);
      }

      query = query
        .order('curation_rank', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limitNum - 1);

      const { data, count, error } = await query;
      if (error) {
        return reply.status(500).send({ success: false, message: error.message });
      }

      return reply.send({
        success: true,
        total: count || 0,
        page: pageNum,
        limit: limitNum,
        products: data || [],
      });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err?.message || 'Failed to list admin products' });
    }
  });

  // PATCH /api/v1/admin/products/:id
  fastify.patch<{ Params: { id: string }; Body: Record<string, any> }>(
    '/products/:id',
    async (request, reply) => {
      const { id } = request.params;
      const updates = { ...request.body };
      delete updates.id;
      delete updates.created_at;
      updates.updated_at = new Date().toISOString();

      try {
        const { data, error } = await supabase
          .from('products')
          .update(updates)
          .or(`id.eq.${id},slug.eq.${id}`)
          .select()
          .maybeSingle();

        if (error) {
          return reply.status(400).send({ success: false, message: error.message });
        }

        invalidateCatalogCache();
        await recordAuditLog(request, 'UPDATE_PRODUCT', id, updates);

        return reply.send({ success: true, product: data });
      } catch (err: any) {
        return reply.status(500).send({ success: false, message: err?.message || 'Product update failed' });
      }
    }
  );

  // PATCH /api/v1/admin/products/:id/visibility
  fastify.patch<{ Params: { id: string }; Body: { isHidden?: boolean; hidden?: boolean } }>(
    '/products/:id/visibility',
    async (request, reply) => {
      const { id } = request.params;
      const isHidden = request.body.isHidden !== undefined ? Boolean(request.body.isHidden) : Boolean(request.body.hidden);

      try {
        const { data, error } = await supabase
          .from('products')
          .update({
            is_hidden: isHidden,
            updated_at: new Date().toISOString(),
          })
          .or(`id.eq.${id},slug.eq.${id}`)
          .select()
          .maybeSingle();

        if (error) {
          return reply.status(400).send({ success: false, message: error.message });
        }

        invalidateCatalogCache();
        await recordAuditLog(request, 'TOGGLE_PRODUCT_VISIBILITY', id, { is_hidden: isHidden });

        return reply.send({
          success: true,
          message: `Product visibility set to ${isHidden ? 'hidden' : 'visible'}.`,
          product: data,
          isHidden,
        });
      } catch (err: any) {
        return reply.status(500).send({ success: false, message: err?.message || 'Visibility toggle failed' });
      }
    }
  );

  // DELETE /api/v1/admin/products/:id (Soft-Delete)
  fastify.delete<{ Params: { id: string } }>('/products/:id', async (request, reply) => {
    const { id } = request.params;

    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          deleted_at: new Date().toISOString(),
          is_hidden: true,
          updated_at: new Date().toISOString(),
        })
        .or(`id.eq.${id},slug.eq.${id}`)
        .select()
        .maybeSingle();

      if (error) {
        return reply.status(400).send({ success: false, message: error.message });
      }

      invalidateCatalogCache();
      await recordAuditLog(request, 'SOFT_DELETE_PRODUCT', id, { deleted_at: new Date().toISOString() });

      return reply.send({
        success: true,
        message: 'Product archived successfully (soft-deleted from active catalog).',
        product: data,
      });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err?.message || 'Product deletion failed' });
    }
  });

  // ==========================================
  // 3. ARTISAN APPLICATIONS & QUESTIONNAIRES
  // ==========================================
  fastify.get('/applications', async (_request, reply) => {
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

  fastify.patch<{ Params: { id: string }; Body: { status: string; reviewNotes?: string; adminEmail?: string } }>(
    '/applications/:id/status',
    async (request, reply) => {
      const { id } = request.params;
      const { status, reviewNotes } = request.body;
      const user = request.user as { email?: string } | undefined;
      const adminEmail = user?.email || request.body.adminEmail || 'admin@gargisaha.com';

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

        // If approved, promote user to artisan in user_roles and create profile
        if (status === 'approved' && data?.email) {
          await supabase.from('user_roles').upsert({
            user_email: data.email,
            role: 'artisan',
            assigned_by: adminEmail,
            updated_at: new Date().toISOString(),
          });

          await supabase.from('artisan_profiles').upsert({
            user_email: data.email,
            full_name: data.name,
            phone: data.phone,
            craft_specialty: data.type_of_art || 'Handloom Heritage',
            region: data.state || 'India',
            is_verified: true,
            is_active: true,
            updated_at: new Date().toISOString(),
          });
        }

        await recordAuditLog(request, 'UPDATE_APPLICATION_STATUS', id, { status, adminEmail });

        return reply.send({ success: true, application: data });
      } catch (err: any) {
        return reply.status(500).send({ success: false, message: err.message });
      }
    }
  );

  // ==========================================
  // 4. ARTISAN PROFILES
  // ==========================================
  fastify.get('/artisans', async (_request, reply) => {
    try {
      const { data, error } = await supabase
        .from('artisan_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return reply.status(500).send({ success: false, message: error.message });
      }

      return reply.send({ success: true, count: data?.length || 0, artisans: data || [] });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err?.message || 'Artisan fetch failure' });
    }
  });

  fastify.get<{ Params: { email: string } }>('/artisans/:email', async (request, reply) => {
    const { email } = request.params;
    const cleanEmail = email.toLowerCase().trim();

    try {
      const [profileRes, productsRes] = await Promise.all([
        supabase.from('artisan_profiles').select('*').eq('user_email', cleanEmail).maybeSingle(),
        supabase.from('products').select('*').eq('artisan_email', cleanEmail).is('deleted_at', null),
      ]);

      return reply.send({
        success: true,
        profile: profileRes.data || null,
        products: productsRes.data || [],
      });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err?.message || 'Artisan detail fetch failure' });
    }
  });

  // ==========================================
  // 5. BESPOKE COMMISSIONS
  // ==========================================
  fastify.get('/bespoke', async (_request, reply) => {
    try {
      const { data, error } = await supabase
        .from('bespoke_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return reply.status(500).send({ success: false, message: error.message });
      }

      return reply.send({ success: true, count: data?.length || 0, requests: data || [] });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err?.message || 'Bespoke fetch failure' });
    }
  });

  fastify.patch<{ Params: { id: string }; Body: Record<string, any> }>(
    '/bespoke/:id',
    async (request, reply) => {
      const { id } = request.params;
      const updates = { ...request.body };
      delete updates.id;
      delete updates.created_at;
      updates.updated_at = new Date().toISOString();

      try {
        const { data, error } = await supabase
          .from('bespoke_requests')
          .update(updates)
          .or(`id.eq.${id},request_number.eq.${id}`)
          .select()
          .maybeSingle();

        if (error) {
          return reply.status(400).send({ success: false, message: error.message });
        }

        await recordAuditLog(request, 'UPDATE_BESPOKE_REQUEST', id, updates);

        return reply.send({ success: true, request: data });
      } catch (err: any) {
        return reply.status(500).send({ success: false, message: err?.message || 'Bespoke update failure' });
      }
    }
  );
};
