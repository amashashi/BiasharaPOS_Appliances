import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  // bodyParser off so we can raise the JSON limit: CSV catalog imports
  // arrive as { csv } payloads that outgrow express's 100kb default.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  app.useBodyParser('json', { limit: '2mb' });
  app.useBodyParser('urlencoded', { extended: true });
  app.setGlobalPrefix('api');
  // bearer-token auth, no cookies — permissive CORS is fine for the stub era
  // (the POS PWA on :5173 and back office on :5174 call this API directly)
  app.enableCors({ origin: true });
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`biashara-appliances-api listening on :${port}`);
}

void bootstrap();
