import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import websocket from '@fastify/websocket';
import dotenv from 'dotenv';

import { authRoutes } from './routes/auth.routes.js';
import { productsRoutes } from './routes/products.routes.js';
import { ordersRoutes } from './routes/orders.routes.js';
import { sellerRoutes } from './routes/seller.routes.js';

dotenv.config();

export async function buildApp(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: true,
  });

  // 1. CORS Configuration
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  await fastify.register(cors, {
    origin: [frontendUrl, 'http://localhost:3000', 'https://www.gargisaha.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // 2. JWT Plugin
  const jwtSecret = process.env.JWT_SECRET || 'house_of_gargi_vedic_auth_secret_2026';
  await fastify.register(jwt, {
    secret: jwtSecret,
  });

  // 3. WebSockets Plugin
  await fastify.register(websocket);

  // 4. Swagger / OpenAPI Documentation
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

  // 5. Health Check Endpoint
  fastify.get('/health', async () => {
    return {
      status: 'healthy',
      service: 'House of Gargi Fastify Backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  // 6. Real-time WebSocket Hub (/ws/sync)
  fastify.get('/ws/sync', { websocket: true }, (socket, req) => {
    fastify.log.info('Patron WebSocket connected for real-time synchronization');

    socket.on('message', (data: Buffer | string) => {
      try {
        const parsed = JSON.parse(data.toString());
        // Echo / broadcast delta to active connections
        fastify.websocketServer.clients.forEach((client) => {
          if (client !== socket && client.readyState === 1) {
            client.send(JSON.stringify(parsed));
          }
        });
      } catch (e) {
        fastify.log.warn('WebSocket message parse error');
      }
    });

    socket.on('close', () => {
      fastify.log.info('Patron WebSocket disconnected');
    });
  });

  // 7. Route Registrations
  await fastify.register(authRoutes, { prefix: '/api/v1/auth' });
  await fastify.register(productsRoutes, { prefix: '/api/v1/products' });
  await fastify.register(ordersRoutes, { prefix: '/api/v1/orders' });
  await fastify.register(sellerRoutes, { prefix: '/api/v1/seller' });

  return fastify;
}
