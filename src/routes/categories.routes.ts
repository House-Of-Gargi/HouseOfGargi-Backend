import { FastifyPluginAsync } from 'fastify';
import { supabase } from '../db/supabase.js';

export const categoriesRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/v1/categories
  fastify.get('/', async (_request, reply) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error || !data || data.length === 0) {
        return reply.send({
          success: true,
          categories: [
            { id: 'sarees', name: 'Royal Sarees', sanskrit_lipi: 'गार्गी सूत्रम्', slug: 'sarees', display_order: 1 },
            { id: 'lehengas', name: 'Bridal Lehengas', sanskrit_lipi: 'राज दरबार', slug: 'lehengas', display_order: 2 },
            { id: 'kurta-sets', name: 'Heritage Kurta Sets', sanskrit_lipi: 'पवित्र परम्परा', slug: 'kurta-sets', display_order: 3 },
            { id: 'accessories', name: 'Courtly Jewellery', sanskrit_lipi: 'শৃঙ্গার অলঙ্কার', slug: 'accessories', display_order: 4 },
          ],
        });
      }

      return reply.send({ success: true, categories: data });
    } catch {
      return reply.send({ success: true, categories: [] });
    }
  });
};
