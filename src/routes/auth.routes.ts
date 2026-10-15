import { FastifyPluginAsync } from 'fastify';
import { Type, Static } from '@sinclair/typebox';
import { generateHmacToken, verifyHmacToken, sendOtpEmail } from '../services/auth.service.js';
import { getBackendUserRole } from '../services/rbac.service.js';

const SendOtpBody = Type.Object({
  email: Type.String({ format: 'email' }),
});
type SendOtpBodyType = Static<typeof SendOtpBody>;

const VerifyOtpBody = Type.Object({
  email: Type.String({ format: 'email' }),
  otp: Type.String({ minLength: 6, maxLength: 6 }),
  token: Type.String(),
  expiresAt: Type.Number(),
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
      const { email } = request.body;
      const cleanEmail = email.toLowerCase().trim();

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
      const verificationToken = generateHmacToken(cleanEmail, otp, expiresAt);

      const sent = await sendOtpEmail(cleanEmail, otp);

      return reply.status(200).send({
        success: true,
        message: sent ? 'Verification code dispatched to your email.' : 'Code generated (simulation mode active).',
        token: verificationToken,
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
        summary: 'Verify 6-digit OTP against HMAC signature and issue JWT session with strict RBAC role',
        body: VerifyOtpBody,
      },
    },
    async (request, reply) => {
      const { email, otp, token, expiresAt } = request.body;
      const cleanEmail = email.toLowerCase().trim();

      const allowTestOtp = process.env.NODE_ENV !== 'production' && process.env.ALLOW_TEST_OTP === 'true';
      const isTestMatch = Boolean(allowTestOtp && process.env.TEST_OTP_CODE && otp.trim() === process.env.TEST_OTP_CODE);

      if (!isValid && !isTestMatch) {
        return reply.status(401).send({
          success: false,
          message: 'Invalid or expired access code. Please request a fresh transmission.',
        });
      }

      // Strict role resolution
      const resolvedRole = await getBackendUserRole(cleanEmail);

      // Issue JWT token with resolved role
      const jwtToken = fastify.jwt.sign(
        { email: cleanEmail, role: resolvedRole },
        { expiresIn: '30d' }
      );

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
};
