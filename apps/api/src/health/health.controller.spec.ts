import { describe, expect, it } from 'vitest';
import { HealthController, API_VERSION } from './health.controller.js';

describe('HealthController', () => {
  it('reports ok with service identity', () => {
    const controller = new HealthController();
    expect(controller.health()).toEqual({
      status: 'ok',
      service: 'biashara-appliances-api',
      version: API_VERSION,
    });
  });
});
