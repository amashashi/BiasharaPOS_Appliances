import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { HealthController } from './health/health.controller.js';
import { PlatformModule } from './platform/platform.module.js';
import { AuthGuard } from './auth/auth.guard.js';

@Module({
  imports: [PlatformModule],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
