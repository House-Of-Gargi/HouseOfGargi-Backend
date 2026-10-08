import { FastifyPluginAsync } from 'fastify';
import { Type, Static } from '@sinclair/typebox';
import {
  getFilteredProducts,
  getProductById,
  getCuratedCategories,
  invalidateCatalogCache,
} from '../services/catalog.service.js';

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
      const categories = getCuratedCategories();
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
        summary: 'List products with cached PostgreSQL querying and search filters',
        querystring: GetProductsQuery,
      },
    },
    async (request, reply) => {
      const { category, featured, search } = request.query;
      const products = await getFilteredProducts({ category, featured, search });

      return reply.send({
        success: true,
        count: products.length,
        categories: getCuratedCategories(),
        products,
      });
    }
  );

  // GET /api/v1/products/:id
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        tags: ['Catalog'],
        summary: 'Get complete product detail by ID from live catalog',
        params: Type.Object({ id: Type.String() }),
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const product = await getProductById(id);

      if (!product) {
        return reply.status(404).send({
          success: false,
          error: 'Not Found',
          message: `Product with ID '${id}' not found in atelier catalog.`,
        });
      }

      return reply.send({
        success: true,
        product,
      });
    }
  );

  // POST /api/v1/products/cache/invalidate
  fastify.post(
    '/cache/invalidate',
    {
      schema: {
        tags: ['Catalog'],
        summary: 'Invalidate in-memory catalog cache when products are updated in Supabase',
      },
    },
    async (_request, reply) => {
      invalidateCatalogCache();
      return reply.send({
        success: true,
        message: 'Product catalog cache successfully invalidated and refreshed.',
      });
    }
  );
};
