import { Controller, Get } from '@nestjs/common';
import type { HealthStatus } from '@biashara/shared';

export const API_VERSION = '0.1.0';

@Controller('health')
export class HealthController {
  @Get()
  health(): HealthStatus {
    return { status: 'ok', service: 'biashara-appliances-api', version: API_VERSION };
  }
}
