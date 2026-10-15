import { FastifyPluginAsync } from 'fastify';
import { supabase } from '../db/supabase.js';

export const superAdminRoutes: FastifyPluginAsync = async (fastify) => {
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
          assigned_by: 'super_admin_console',
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return reply.status(500).send({ success: false, message: error.message });
      }

      return reply.send({ success: true, message: `Role ${validRole} assigned to ${cleanEmail}`, admin: data });
    }
  );

  // DELETE /api/v1/super-admin/admins/:email
  fastify.delete<{ Params: { email: string } }>(
    '/admins/:email',
    async (request, reply) => {
      const { email } = request.params;
      const cleanEmail = email.toLowerCase().trim();

      // Prevent self-lockout or removing core founders
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

      return reply.send({ success: true, message: `Access revoked for ${cleanEmail}` });
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
      const { data: prods, error } = await supabase.from('products').select('*');
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
          revenue: Number(p.total_gross_revenue) || 0,
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
};
