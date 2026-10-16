import { FastifyPluginAsync } from 'fastify';
import { Type, Static } from '@sinclair/typebox';
import {
  generateOtp,
  generateHmacToken,
  verifyHmacToken,
  sendOtpEmail,
  isTokenUsed,
  recordUsedToken,
} from '../services/auth.service.js';
import { getBackendUserRole } from '../services/rbac.service.js';

const SendOtpBody = Type.Object({
  email: Type.String({ format: 'email' }),
  portal: Type.Optional(Type.String()),
});
type SendOtpBodyType = Static<typeof SendOtpBody>;

const VerifyOtpBody = Type.Object({
  email: Type.String({ format: 'email' }),
  otp: Type.String({ minLength: 6, maxLength: 6 }),
  token: Type.Optional(Type.String()),
  verificationToken: Type.Optional(Type.String()),
  expiresAt: Type.Number(),
  portal: Type.Optional(Type.String()),
});
type VerifyOtpBodyType = Static<typeof VerifyOtpBody>;

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/v1/auth/otp/send
  fastify.post<{ Body: SendOtpBodyType }>(
    '/otp/send',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '5 minutes',
        },
      },
      schema: {
        tags: ['Authentication'],
        summary: 'Generate and send a 6-digit cryptographic OTP to user email',
        body: SendOtpBody,
      },
    },
    async (request, reply) => {
      const { email, portal } = request.body;
      const cleanEmail = email.toLowerCase().trim();

      const resolvedRole = await getBackendUserRole(cleanEmail);

      if (portal === 'admin') {
        if (resolvedRole !== 'admin' && resolvedRole !== 'super_admin') {
          return reply.status(403).send({
            success: false,
            message: 'Access restricted. This email is not registered as an Admin or Super Admin with House of Gargi.',
          });
        }
      }

      const otp = generateOtp();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
      const verificationToken = generateHmacToken(cleanEmail, otp, expiresAt);

      const sent = await sendOtpEmail(cleanEmail, otp, portal, resolvedRole);

      return reply.status(200).send({
        success: true,
        message: sent ? 'Verification code dispatched to your email.' : 'Code generated (simulation mode active).',
        token: verificationToken,
        verificationToken,
        expiresAt,
      });
    }
  );

  // POST /api/v1/auth/otp/verify
  fastify.post<{ Body: VerifyOtpBodyType }>(
    '/otp/verify',
    {
      schema: {
        tags: ['Authentication'],
        summary: 'Verify 6-digit OTP against HMAC signature, enforce single-use replay protection, and issue httpOnly JWT session',
        body: VerifyOtpBody,
      },
    },
    async (request, reply) => {
      const { email, otp, token: rawToken, verificationToken: rawVerifToken, expiresAt } = request.body;
      const cleanEmail = email.toLowerCase().trim();
      const token = (rawToken || rawVerifToken || '').trim();

      if (!token) {
        return reply.status(401).send({
          success: false,
          message: 'Invalid or expired access code session. Please request a fresh transmission.',
        });
      }

      // 1. Single-use token validation (replay attack prevention)
      const alreadyUsed = await isTokenUsed(token);
      if (alreadyUsed) {
        return reply.status(401).send({
          success: false,
          message: 'This access code has already been utilized. Please request a fresh transmission.',
        });
      }

      // 2. Cryptographic HMAC validation
      const isValid = verifyHmacToken(cleanEmail, otp.trim(), expiresAt, token);
      const allowTestOtp = process.env.NODE_ENV !== 'production' && process.env.ALLOW_TEST_OTP === 'true';
      const isTestMatch = Boolean(allowTestOtp && process.env.TEST_OTP_CODE && otp.trim() === process.env.TEST_OTP_CODE);

      if (!isValid && !isTestMatch) {
        return reply.status(401).send({
          success: false,
          message: 'Invalid or expired access code. Please request a fresh transmission.',
        });
      }

      // 3. Mark token as used to prevent any replay
      await recordUsedToken(token, cleanEmail);

      // 4. Strict role resolution from database
      const resolvedRole = await getBackendUserRole(cleanEmail);

      // 5. Issue JWT token
      const jwtToken = fastify.jwt.sign(
        { email: cleanEmail, role: resolvedRole },
        { expiresIn: '30d' }
      );

      // 6. Set httpOnly signed session cookie
      reply.setCookie('hog_session', jwtToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        domain: process.env.COOKIE_DOMAIN || undefined,
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });

      return reply.status(200).send({
        success: true,
        message: 'Authentication verified successfully.',
        token: jwtToken,
        user: {
          email: cleanEmail,
          role: resolvedRole,
          authenticatedAt: new Date().toISOString(),
        },
      });
    }
  );

  // GET /api/v1/auth/me
  fastify.get(
    '/me',
    {
      schema: {
        tags: ['Authentication'],
        summary: 'Retrieve authenticated session user and real-time database role',
      },
    },
    async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({
          success: false,
          message: 'No active authenticated session.',
        });
      }

      const payload = request.user as { email?: string; role?: string } | undefined;
      if (!payload?.email) {
        return reply.status(401).send({
          success: false,
          message: 'Invalid session payload.',
        });
      }

      const freshRole = await getBackendUserRole(payload.email);
      return reply.status(200).send({
        success: true,
        user: {
          email: payload.email,
          role: freshRole,
        },
      });
    }
  );

  // GET /api/v1/auth/role
  fastify.get<{ Querystring: { email?: string } }>(
    '/role',
    {
      schema: {
        tags: ['Authentication'],
        summary: 'Resolve authoritative user role from database',
      },
    },
    async (request, reply) => {
      const { email } = request.query;
      if (!email) {
        return reply.status(400).send({
          success: false,
          message: 'Email parameter is required',
        });
      }

      const cleanEmail = email.toLowerCase().trim();
      const resolvedRole = await getBackendUserRole(cleanEmail);

      return reply.status(200).send({
        success: true,
        email: cleanEmail,
        role: resolvedRole,
      });
    }
  );

  // POST /api/v1/auth/logout
  fastify.post(
    '/logout',
    {
      schema: {
        tags: ['Authentication'],
        summary: 'Sign out and destroy session cookie',
      },
    },
    async (_request, reply) => {
      reply.clearCookie('hog_session', {
        path: '/',
        domain: process.env.COOKIE_DOMAIN || undefined,
      });

      return reply.status(200).send({
        success: true,
        message: 'Signed out successfully.',
      });
    }
  );
};
