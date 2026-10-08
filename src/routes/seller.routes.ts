import { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { products } from '../db/catalog.js';

export const sellerRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/v1/seller/analytics
  fastify.get(
    '/analytics',
    {
      schema: {
        tags: ['Seller Atelier'],
        summary: 'Compute merchant telemetry, revenue breakdown, and inventory stats for Recharts',
      },
    },
    async (_request, reply) => {
      const totalInventoryValue = products.reduce((acc, p) => acc + p.price, 0);

      const categoryDistribution = [
        { name: 'Sarees', count: products.filter((p) => p.category === 'sarees').length, value: 497 },
        { name: 'Lehengas', count: products.filter((p) => p.category === 'lehengas').length, value: 2325 },
        { name: 'Kurta Sets', count: products.filter((p) => p.category === 'kurta-sets').length, value: 58 },
        { name: 'Accessories', count: products.filter((p) => p.category === 'accessories').length, value: 223 },
      ];

      const monthlyRevenue = [
        { month: 'Apr', revenue: 12400 },
        { month: 'May', revenue: 18900 },
        { month: 'Jun', revenue: 22100 },
        { month: 'Jul', revenue: 28400 },
        { month: 'Aug', revenue: 34200 },
        { month: 'Sep', revenue: 41800 },
        { month: 'Oct', revenue: 49500 },
      ];

      return reply.send({
        success: true,
        stats: {
          totalProducts: products.length,
          totalInventoryValue,
          activeOrders: 14,
          fulfilledOrders: 182,
        },
        categoryDistribution,
        monthlyRevenue,
      });
    }
  );
};
