import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import websocket from '@fastify/websocket';
import dotenv from 'dotenv';
import process from 'node:process';

import { authRoutes } from './routes/auth.routes.js';
import { productsRoutes } from './routes/products.routes.js';
import { ordersRoutes } from './routes/orders.routes.js';
import { sellerRoutes } from './routes/seller.routes.js';
import { supabase } from './db/supabase.js';

dotenv.config();

export async function buildApp(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: true,
    requestIdHeader: 'x-request-id',
    genReqId: (req) =>
      (req.headers['x-request-id'] as string) ||
      `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
  });

  // Attach request ID header to all outgoing responses
  fastify.addHook('onSend', async (request, reply) => {
    reply.header('x-request-id', request.id);
  });

  // 1. Security Headers via Helmet
  await fastify.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });

  // 2. Global Rate Limiting (Prevents DDoS and Auto-Scrapers)
  await fastify.register(rateLimit, {
    max: 150,
    timeWindow: '1 minute',
    errorResponseBuilder: (req, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Automated scraping is restricted.',
    }),
  });

  // 3. Anti-Crawler User-Agent Filter Hook
  const blockedScrapers = [
    'scrapy', 'sqlmap', 'nikto', 'curb', 'python-requests', 'python-urllib',
    'libwww', 'httpclient', 'auto_crawler', 'semrushbot', 'ahrefsbot',
    'dotbot', 'mj12bot', 'bytespider', 'zoominfobot',
  ];

  fastify.addHook('onRequest', async (request, reply) => {
    // Exempt health pings, robots.txt, and swagger docs
    if (
      request.url === '/health' ||
      request.url === '/robots.txt' ||
      request.url.startsWith('/documentation')
    ) {
      return;
    }
    const ua = (request.headers['user-agent'] || '').toLowerCase();
    if (blockedScrapers.some((bot) => ua.includes(bot))) {
      reply.status(403).send({
        error: 'Forbidden',
        message: 'Automated scraping and crawling are prohibited on this API.',
      });
      return;
    }
  });

  // 4. CORS Configuration
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  await fastify.register(cors, {
    origin: [
      frontendUrl,
      'http://localhost:3000',
      'http://localhost:3001',
      'https://www.gargisaha.com',
      'https://gargisaha.com',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // 5. JWT Plugin
  const jwtSecret = process.env.JWT_SECRET || 'house_of_gargi_vedic_auth_secret_2026';
  await fastify.register(jwt, {
    secret: jwtSecret,
  });

  // 6. WebSockets Plugin
  await fastify.register(websocket);

  // 7. Swagger / OpenAPI Documentation
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'House of Gargi Atelier API',
        description: 'High-throughput enterprise API gateway for House of Gargi luxury fashion',
        version: '1.0.0',
      },
      servers: [
        {
          url: 'http://localhost:5000',
          description: 'Local development server',
        },
      ],
      tags: [
        { name: 'Authentication', description: 'Patron OTP and JWT session management' },
        { name: 'Catalog', description: 'Handcrafted products, categories, and inventory' },
        { name: 'Checkout & Orders', description: 'Cart checkout sessions and order placement' },
        { name: 'Seller Atelier', description: 'Vendor management, analytics, and telemetry' },
      ],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });

  // 8. Base Directives & Health
  fastify.get('/robots.txt', async (_req, reply) => {
    reply.type('text/plain');
    return 'User-agent: *\nDisallow: /\n';
  });

  fastify.get('/', async () => {
    return {
      service: 'House of Gargi API Gateway',
      version: '1.0.0',
      status: 'operational',
      documentation: '/documentation',
      health: '/health',
    };
  });

  fastify.get('/health', async () => {
    return {
      status: 'healthy',
      service: 'House of Gargi Fastify Backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  // 9. Coupon Verification Endpoint
  fastify.get<{ Params: { code: string } }>('/api/v1/coupons/:code', async (request, reply) => {
    const code = request.params.code.trim().toUpperCase();
    if (code === 'VEDIC10') {
      return reply.send({
        valid: true,
        code: 'VEDIC10',
        discount_percent: 10,
        min_order_rupees: 5000,
        max_discount_rupees: 2500,
        description: '10% atelier inaugural discount on orders above ₹5,000',
      });
    }

    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single();

      if (!error && data) {
        return reply.send({
          valid: true,
          code: data.code,
          discount_percent: data.discount_percent,
          discount_flat_rupees: data.discount_flat_rupees,
          min_order_rupees: data.min_order_rupees,
          max_discount_rupees: data.max_discount_rupees,
        });
      }
    } catch {
      // Fall through to 404
    }

    return reply.status(404).send({
      valid: false,
      message: `Coupon code '${code}' is invalid or expired.`,
    });
  });

  // 10. Real-time WebSocket Hub (/ws/sync)
  fastify.get('/ws/sync', { websocket: true }, (socket, _req) => {
    fastify.log.info('Patron WebSocket connected for real-time synchronization');

    socket.on('message', (data: Buffer | string) => {
      try {
        const parsed = JSON.parse(data.toString());
        // Echo delta to active client tabs
        fastify.websocketServer.clients.forEach((client) => {
          if (client !== socket && client.readyState === 1) {
            client.send(JSON.stringify(parsed));
          }
        });
      } catch {
        fastify.log.warn('WebSocket message parse error');
      }
    });

    socket.on('close', () => {
      fastify.log.info('Patron WebSocket disconnected');
    });
  });

  // 11. Route Registrations
  await fastify.register(authRoutes, { prefix: '/api/v1/auth' });
  await fastify.register(productsRoutes, { prefix: '/api/v1/products' });
  await fastify.register(ordersRoutes, { prefix: '/api/v1/orders' });
  await fastify.register(sellerRoutes, { prefix: '/api/v1/seller' });

  // 12. Standard RFC 7807 Global Error Handler
  fastify.setErrorHandler((error: any, request, reply) => {
    const statusCode = error.statusCode || 500;
    const isProduction = process.env.NODE_ENV === 'production';

    request.log.error({ err: error, reqId: request.id }, 'Request encountered error');

    reply.status(statusCode).send({
      type: `https://houseofgargi-backend.onrender.com/errors/${error.code || 'INTERNAL_ERROR'}`,
      title: error.name || 'Internal Server Error',
      status: statusCode,
      detail:
        statusCode === 500 && isProduction
          ? 'An unexpected error occurred. Our atelier team has been notified.'
          : error.message,
      code: error.code || 'ERR_INTERNAL',
      instance: request.url,
      requestId: request.id,
      timestamp: new Date().toISOString(),
    });
  });

  // 13. Not Found Handler
  fastify.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      status: 404,
      error: 'Not Found',
      message: `The endpoint '${request.method} ${request.url}' does not exist on House of Gargi API.`,
      documentation: '/documentation',
      requestId: request.id,
    });
  });

  return fastify;
}
