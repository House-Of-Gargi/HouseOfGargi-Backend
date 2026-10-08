import { FastifyPluginAsync } from 'fastify';
import { Type, Static } from '@sinclair/typebox';
import { products, categories, Product } from '../db/catalog.js';
import { supabase } from '../db/supabase.js';

const GetProductsQuery = Type.Object({
  category: Type.Optional(Type.String()),
  featured: Type.Optional(Type.Boolean()),
  search: Type.Optional(Type.String()),
});
type GetProductsQueryType = Static<typeof GetProductsQuery>;

export const productsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/v1/products/categories
  fastify.get(
    '/categories',
    {
      schema: {
        tags: ['Catalog'],
        summary: 'Retrieve all curated luxury categories',
      },
    },
    async (_request, reply) => {
      return reply.send({
        success: true,
        count: categories.length,
        categories,
      });
    }
  );

  // GET /api/v1/products
  fastify.get<{ Querystring: GetProductsQueryType }>(
    '/',
    {
      schema: {
        tags: ['Catalog'],
        summary: 'List products with optional category, search, or featured filtering',
        querystring: GetProductsQuery,
      },
    },
    async (request, reply) => {
      const { category, featured, search } = request.query;

      // Try fetching from Supabase PostgreSQL first
      try {
        let query = supabase.from('products').select('*');
        if (category) query = query.eq('category', category);
        if (featured !== undefined) query = query.eq('featured', featured);

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return reply.send({
            success: true,
            count: data.length,
            products: data,
          });
        }
      } catch (dbErr) {
        fastify.log.warn({ err: dbErr }, 'Supabase query fallback to in-memory catalog');
      }

      // In-memory fallback
      let result = [...products];
      if (category) {
        result = result.filter((p) => p.category.toLowerCase() === category.toLowerCase());
      }
      if (featured) {
        result = result.filter((p) => p.featured === true);
      }
      if (search) {
        const q = search.toLowerCase();
        result = result.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.region.toLowerCase().includes(q) ||
            p.technique.toLowerCase().includes(q)
        );
      }

      return reply.send({
        success: true,
        count: result.length,
        categories,
        products: result,
      });
    }
  );

  // GET /api/v1/products/:id
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        tags: ['Catalog'],
        summary: 'Get complete product detail by ID',
        params: Type.Object({ id: Type.String() }),
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      const product = products.find((p) => p.id === id);
      if (!product) {
        return reply.status(404).send({
          success: false,
          message: `Product with ID '${id}' not found in atelier catalog.`,
        });
      }

      return reply.send({
        success: true,
        product,
      });
    }
  );
};
