import { FastifyPluginAsync } from 'fastify';
import { Type, Static } from '@sinclair/typebox';
import { generateHmacToken, verifyHmacToken, sendOtpEmail } from '../services/auth.service.js';

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
        summary: 'Generate and send a 6-digit cryptographic OTP to patron email',
        body: SendOtpBody,
      },
    },
    async (request, reply) => {
      const { email } = request.body;
      const cleanEmail = email.toLowerCase().trim();

      // Generate random 6-digit OTP
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
        summary: 'Verify 6-digit OTP against HMAC signature and issue JWT session',
        body: VerifyOtpBody,
      },
    },
    async (request, reply) => {
      const { email, otp, token, expiresAt } = request.body;
      const cleanEmail = email.toLowerCase().trim();

      const isValid = verifyHmacToken(cleanEmail, otp.trim(), expiresAt, token);

      if (!isValid) {
        return reply.status(401).send({
          success: false,
          message: 'Invalid or expired access code. Please request a fresh transmission.',
        });
      }

      // Issue JWT token via Fastify JWT
      const jwtToken = fastify.jwt.sign(
        { email: cleanEmail, role: 'patron' },
        { expiresIn: '30d' }
      );

      return reply.status(200).send({
        success: true,
        message: 'Patron authentication verified successfully.',
        token: jwtToken,
        patron: {
          email: cleanEmail,
          authenticatedAt: new Date().toISOString(),
        },
      });
    }
  );
};
