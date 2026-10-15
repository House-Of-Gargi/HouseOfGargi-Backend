import { Type, Static } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import dotenv from 'dotenv';
import process from 'node:process';

dotenv.config();

const EnvSchema = Type.Object({
  NODE_ENV: Type.Union(
    [Type.Literal('development'), Type.Literal('production'), Type.Literal('test')],
    { default: 'development' }
  ),
  PORT: Type.String({ default: '5000' }),
  FRONTEND_URL: Type.String({ default: 'http://localhost:3000' }),
  SUPABASE_URL: Type.String({ minLength: 10 }),
  SUPABASE_SERVICE_ROLE_KEY: Type.String({ minLength: 20 }),
  JWT_SECRET: Type.String({ default: 'house_of_gargi_dev_jwt_secret_only' }),
  AUTH_SECRET: Type.String({ default: 'house_of_gargi_dev_auth_secret_only' }),
  RESEND_API_KEY: Type.Optional(Type.String()),
  NOREPLY_EMAIL: Type.String({ default: 'noreply@gargisaha.com' }),
  COOKIE_DOMAIN: Type.Optional(Type.String()),
  REVALIDATE_SECRET: Type.Optional(Type.String()),
});

export type Env = Static<typeof EnvSchema>;

export const env: Env = Value.Decode(
  EnvSchema,
  Value.Default(EnvSchema, { ...process.env })
);
