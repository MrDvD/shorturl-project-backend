import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import { initEndpoints } from './endpoints';
import cors from '@fastify/cors';
import fs from 'fs';

function validateEnvironment() {
  return 'APP_SECRET' in process.env;
}

if (!validateEnvironment()) {
  throw new Error('Unconfigured environment variables for web server.');
}

const fastify = Fastify({
  logger: true,
});

fastify.register(fastifyCookie, {
  secret: process.env.APP_SECRET,
});

await fastify.register(cors, {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});

initEndpoints(fastify);

await fastify.listen({
  port: 8080,
  host: '0.0.0.0',
});
