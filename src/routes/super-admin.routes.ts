import { FastifyPluginAsync } from 'fastify';
import { supabase } from '../db/supabase.js';
import { recordAuditLog } from '../lib/audit.js';

export const superAdminRoutes: FastifyPluginAsync = async (fastify) => {
  // Enforce super_admin role strictly on all super-admin endpoints
  fastify.addHook('preHandler', fastify.requireRole('super_admin'));

  // ==========================================
  // 1. EXECUTIVE DASHBOARD & TELEMETRY
  // ==========================================
  fastify.get('/dashboard', async (_request, reply) => {
    try {
      const [
        { count: totalAdmins },
        { count: totalProducts },
        { count: totalArtisans },
        { count: totalOrders },
        { data: orders },
      ] = await Promise.all([
        supabase.from('user_roles').select('*', { count: 'exact', head: true }).in('role', ['admin', 'super_admin']),
        supabase.from('products').select('*', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('artisan_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('total_rupees'),
      ]);

      const gmv = (orders || []).reduce((acc, o: any) => acc + (Number(o.total_rupees) || 0), 0);
      const commission = Math.round(gmv * 0.15);

      return reply.send({
        success: true,
        metrics: {
          totalAdmins: totalAdmins || 0,
          totalProducts: totalProducts || 0,
          totalArtisans: totalArtisans || 0,
          totalOrders: totalOrders || 0,
          gmvRupees: gmv,
          platformCommissionRupees: commission,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err?.message || 'Executive dashboard error' });
    }
  });

  // ==========================================
  // 2. ADMINISTRATOR PRIVILEGE GOVERNANCE
  // ==========================================
  // GET /api/v1/super-admin/admins
  fastify.get('/admins', async (_request, reply) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .in('role', ['admin', 'super_admin'])
        .order('created_at', { ascending: false });

      if (error) {
        return reply.status(500).send({ success: false, message: error.message });
      }

      const admins = (data || []).map((d: any, idx: number) => ({
        id: d.id || `adm-${idx}`,
        name: d.user_email.split('@')[0],
        email: d.user_email,
        role: d.role,
        department: d.role === 'super_admin' ? 'Executive Governance' : 'Operations & Curation',
        status: 'active',
        createdAt: d.created_at ? d.created_at.split('T')[0] : '2026-10-11',
      }));

      return reply.send({ success: true, count: admins.length, admins });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err?.message || 'Error fetching admins' });
    }
  });

  // POST /api/v1/super-admin/admins
  fastify.post<{ Body: { email: string; role?: string; department?: string } }>(
    '/admins',
    async (request, reply) => {
      const { email, role = 'admin' } = request.body || {};
      if (!email) {
        return reply.status(400).send({ success: false, message: 'Email is required' });
      }

      const cleanEmail = email.toLowerCase().trim();
      const validRole = role === 'super_admin' ? 'super_admin' : 'admin';

      const { data, error } = await supabase
        .from('user_roles')
        .upsert({
          user_email: cleanEmail,
          role: validRole,
          assigned_by: (request.user as any)?.email || 'super_admin_console',
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return reply.status(500).send({ success: false, message: error.message });
      }

      await recordAuditLog(request, 'ASSIGN_ADMIN_ROLE', cleanEmail, { role: validRole });

      return reply.send({ success: true, message: `Role ${validRole} assigned to ${cleanEmail}`, admin: data });
    }
  );

  // DELETE /api/v1/super-admin/admins/:email
  fastify.delete<{ Params: { email: string } }>(
    '/admins/:email',
    async (request, reply) => {
      const { email } = request.params;
      const cleanEmail = email.toLowerCase().trim();
      const currentAdmin = (request.user as any)?.email?.toLowerCase().trim();

      // Prevent self-lockout or removing core founders
      if (cleanEmail === currentAdmin) {
        return reply.status(403).send({ success: false, message: 'You cannot revoke your own administrator account.' });
      }
      if (cleanEmail === 'tanmaysaaagr@gmail.com' || cleanEmail === 'shawsumit6286@gmail.com') {
        return reply.status(403).send({ success: false, message: 'Cannot revoke root founder administrator account.' });
      }

      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_email', cleanEmail);

      if (error) {
        return reply.status(500).send({ success: false, message: error.message });
      }

      await recordAuditLog(request, 'REVOKE_ADMIN_ROLE', cleanEmail);

      return reply.send({ success: true, message: `Access revoked for ${cleanEmail}` });
    }
  );

  // ==========================================
  // 3. CATALOG & REVENUE AGGREGATION
  // ==========================================
  // GET /api/v1/super-admin/catalog
  fastify.get<{ Querystring: { search?: string; category?: string; page?: string; limit?: string } }>(
    '/catalog',
    async (request, reply) => {
      const { search, category, page = '1', limit = '50' } = request.query;
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
      const offset = (pageNum - 1) * limitNum;

      try {
        let query = supabase.from('products').select('*', { count: 'exact' });
        if (category) query = query.eq('category', category.toLowerCase().trim());
        if (search) query = query.or(`name.ilike.%${search}%,product_number.ilike.%${search}%`);

        const { data, count, error } = await query
          .order('created_at', { ascending: false })
          .range(offset, offset + limitNum - 1);

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
        return reply.status(500).send({ success: false, message: err?.message || 'Catalog query error' });
      }
    }
  );

  // GET /api/v1/super-admin/revenue
  fastify.get('/revenue', async (_request, reply) => {
    try {
      const { data: orders, error } = await supabase.from('orders').select('*');
      if (error) {
        return reply.status(500).send({ success: false, message: error.message });
      }

      const ordersList = orders || [];
      const gmvTotalRupees = ordersList.reduce((sum: number, o: any) => sum + (Number(o.total_rupees) || 0), 0);
      const platformCommissionRupees = Math.round(gmvTotalRupees * 0.15); // 15%
      const artisanSettlementsRupees = gmvTotalRupees - platformCommissionRupees; // 85%

      return reply.send({
        success: true,
        gmvTotalRupees,
        platformCommissionRupees,
        artisanSettlementsRupees,
        totalOrders: ordersList.length,
      });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err?.message || 'Error calculating revenue' });
    }
  });

  // GET /api/v1/super-admin/bestsellers
  fastify.get('/bestsellers', async (_request, reply) => {
    try {
      const { data: prods, error } = await supabase.from('products').select('*').is('deleted_at', null);
      if (error) {
        return reply.status(500).send({ success: false, message: error.message });
      }

      const productsList = prods || [];
      const sorted = productsList
        .sort((a: any, b: any) => (Number(b.total_units_sold) || 0) - (Number(a.total_units_sold) || 0))
        .map((p: any, idx: number) => ({
          rank: idx + 1,
          id: p.id,
          title: p.name,
          category: p.category || 'Sarees',
          unitsSold: Number(p.total_units_sold) || 0,
          revenue: Number(p.total_gross_revenue) || (p.price * (p.total_units_sold || 0)),
          isFeatured: Boolean(p.is_featured || p.featured),
        }));

      return reply.send({
        success: true,
        count: sorted.length,
        bestsellers: sorted,
      });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err?.message || 'Error fetching bestsellers' });
    }
  });

  // PATCH /api/v1/super-admin/bestsellers/:id
  fastify.patch<{ Params: { id: string }; Body: { isFeatured: boolean } }>(
    '/bestsellers/:id',
    async (request, reply) => {
      const { id } = request.params;
      const { isFeatured } = request.body || {};

      const { data, error } = await supabase
        .from('products')
        .update({ is_featured: Boolean(isFeatured), updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return reply.status(500).send({ success: false, message: error.message });
      }

      return reply.send({ success: true, message: 'Featured status updated', product: data });
    }
  );

  // ==========================================
  // 4. CATEGORY GOVERNANCE
  // ==========================================
  fastify.post<{ Body: { id: string; name: string; slug?: string; description?: string; displayOrder?: number } }>(
    '/categories',
    async (request, reply) => {
      const { id, name, slug, description, displayOrder = 10 } = request.body || {};
      if (!id || !name) {
        return reply.status(400).send({ success: false, message: 'Category ID and Name are required.' });
      }

      try {
        const { data, error } = await supabase
          .from('categories')
          .insert({
            id: id.toLowerCase().trim(),
            name,
            slug: slug || id.toLowerCase().trim(),
            description: description || '',
            display_order: displayOrder,
            is_active: true,
          })
          .select()
          .single();

        if (error) {
          return reply.status(400).send({ success: false, message: error.message });
        }

        await recordAuditLog(request, 'CREATE_CATEGORY', id, { name });
        return reply.status(201).send({ success: true, category: data });
      } catch (err: any) {
        return reply.status(500).send({ success: false, message: err?.message || 'Category creation failed' });
      }
    }
  );

  fastify.patch<{ Params: { id: string }; Body: Record<string, any> }>(
    '/categories/:id',
    async (request, reply) => {
      const { id } = request.params;
      const updates = { ...request.body };
      delete updates.id;

      try {
        const { data, error } = await supabase
          .from('categories')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          return reply.status(400).send({ success: false, message: error.message });
        }

        await recordAuditLog(request, 'UPDATE_CATEGORY', id, updates);
        return reply.send({ success: true, category: data });
      } catch (err: any) {
        return reply.status(500).send({ success: false, message: err?.message || 'Category update failed' });
      }
    }
  );

  // ==========================================
  // 5. AUDIT TRAIL LOGGING
  // ==========================================
  fastify.get<{ Querystring: { page?: string; limit?: string } }>('/audit-logs', async (request, reply) => {
    const { page = '1', limit = '50' } = request.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    try {
      const { data, count, error } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limitNum - 1);

      if (error) {
        return reply.status(500).send({ success: false, message: error.message });
      }

      return reply.send({
        success: true,
        total: count || 0,
        page: pageNum,
        limit: limitNum,
        auditLogs: data || [],
      });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err?.message || 'Audit trail fetch failure' });
    }
  });
};
