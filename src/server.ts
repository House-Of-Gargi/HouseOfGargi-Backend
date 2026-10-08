import process from 'node:process';
import { buildApp } from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const port = Number(process.env.PORT) || 5000;
const host = process.env.HOST || '0.0.0.0';

async function main() {
  const app = await buildApp();

  try {
    await app.listen({ port, host });
    console.log(`\n======================================================`);
    console.log(`✦ House of Gargi Fastify Backend Service Started ✦`);
    const baseUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`;
    const wsUrl = process.env.RENDER_EXTERNAL_URL
      ? process.env.RENDER_EXTERNAL_URL.replace(/^http/, 'ws') + '/ws/sync'
      : `ws://localhost:${port}/ws/sync`;
    console.log(`  API Gateway:      ${baseUrl}`);
    console.log(`  Swagger OpenAPI:  ${baseUrl}/documentation`);
    console.log(`  Health Check:     ${baseUrl}/health`);
    console.log(`  WebSocket Hub:    ${wsUrl}`);
    console.log(`======================================================\n`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
