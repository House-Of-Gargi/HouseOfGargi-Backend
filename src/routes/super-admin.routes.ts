import { FastifyPluginAsync } from 'fastify';
import { supabase } from '../db/supabase.js';

export const superAdminRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/v1/super-admin/admins
  fastify.get('/admins', async (_request, reply) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .in('role', ['admin', 'super_admin']);

      if (error || !data) {
        return reply.send({
          success: true,
          admins: [
            { user_email: 'gargisaha1508@gmail.com', role: 'super_admin', status: 'active' },
            { user_email: 'shawsumit6286@gmail.com', role: 'super_admin', status: 'active' },
            { user_email: 'admin@gargisaha.com', role: 'admin', status: 'active' },
            { user_email: 'curator@gargisaha.com', role: 'admin', status: 'active' },
          ],
        });
      }

      return reply.send({ success: true, admins: data });
    } catch {
      return reply.send({ success: true, admins: [] });
    }
  });

  // GET /api/v1/super-admin/revenue
  fastify.get('/revenue', async (_request, reply) => {
    return reply.send({
      success: true,
      gmvTotalRupees: 1484000,
      platformCommissionRupees: 222600, // 15%
      artisanSettlementsRupees: 1261400, // 85%
      craftRegionDistribution: [
        { region: 'Varanasi', gmv: 590000, percentage: 39.8 },
        { region: 'Kanchipuram', gmv: 420000, percentage: 28.3 },
        { region: 'Lucknow', gmv: 270000, percentage: 18.2 },
        { region: 'Chanderi', gmv: 204000, percentage: 13.7 },
      ],
    });
  });

  // GET /api/v1/super-admin/bestsellers
  fastify.get('/bestsellers', async (_request, reply) => {
    return reply.send({
      success: true,
      bestsellers: [
        { rank: 1, title: 'Banarasi Katan Silk Kadwa Saree', unitsSold: 14, revenue: 399000, isFeatured: true },
        { rank: 2, title: 'Chanderi Gold Zari Handwoven Kurta Set', unitsSold: 18, revenue: 297000, isFeatured: false },
        { rank: 3, title: 'Kanchipuram Pure Mulberry Korvai Saree', unitsSold: 9, revenue: 288000, isFeatured: true },
        { rank: 4, title: 'Royal Zardozi Bridal Lehenga', unitsSold: 6, revenue: 270000, isFeatured: false },
        { rank: 5, title: 'Paithani Peacock Asawali Silk Saree', unitsSold: 5, revenue: 190000, isFeatured: false },
      ],
    });
  });
};
