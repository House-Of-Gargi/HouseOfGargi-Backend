import fp from 'fastify-plugin';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { AppRole } from '../services/rbac.service.js';

declare module 'fastify' {
  interface FastifyInstance {
    requireRole: (...roles: AppRole[]) => (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export const authPlugin = fp(async (fastify) => {
  fastify.decorate('authenticate', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify();
    } catch {
      return reply.code(401).send({
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Valid authentication session required. Please sign in.',
      });
    }
  });

  fastify.decorate('requireRole', (...roles: AppRole[]) => {
    return async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        await req.jwtVerify();
      } catch {
        return reply.code(401).send({
          status: 401,
          code: 'UNAUTHORIZED',
          message: 'Valid authentication session required. Please sign in.',
        });
      }

      const user = req.user as { email?: string; role?: AppRole } | undefined;
      const userRole = user?.role;

      if (!userRole || !roles.includes(userRole)) {
        return reply.code(403).send({
          status: 403,
          code: 'FORBIDDEN',
          message: `Access denied. Required role: [${roles.join(', ')}].`,
        });
      }
    };
  });
});
