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
    console.log(`  API Gateway:      http://localhost:${port}`);
    console.log(`  Swagger OpenAPI:  http://localhost:${port}/documentation`);
    console.log(`  Health Check:     http://localhost:${port}/health`);
    console.log(`  WebSocket Hub:    ws://localhost:${port}/ws/sync`);
    console.log(`======================================================\n`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
