import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import type { PaymentsService } from '@biashara/shared';
import { MmResolveDevController } from './mm-resolve.controller.js';

/**
 * Secure-by-default gate for the stub-era mm-resolve simulator (D-034). The
 * endpoint is unauthenticated and confirms stub payments with no money
 * collected, so it must be dead in any real deployment. We assert the gate by
 * env combination: a disabled gate throws NotFoundException BEFORE touching
 * payments; an enabled gate falls through to the (here, unknown-intent) 400.
 */
describe('MmResolveDevController secure-by-default gate (T5.1)', () => {
  const confirmed: string[] = [];
  const fakePayments = {
    confirm: async (id: string) => {
      confirmed.push(id);
    },
    fail: async () => {},
  } as unknown as PaymentsService;
  const controller = new MmResolveDevController(fakePayments);

  const saved = { dev: process.env.DEV_AUTH, mode: process.env.IDENTITY_MODE };
  const setEnv = (dev?: string, mode?: string): void => {
    if (dev === undefined) delete process.env.DEV_AUTH;
    else process.env.DEV_AUTH = dev;
    if (mode === undefined) delete process.env.IDENTITY_MODE;
    else process.env.IDENTITY_MODE = mode;
  };

  beforeEach(() => {
    confirmed.length = 0;
  });
  afterEach(() => setEnv(saved.dev, saved.mode));

  const expectDisabled = async (): Promise<void> => {
    await expect(controller.mmResolve({ intentId: 'x', outcome: 'CONFIRMED' })).rejects.toBeInstanceOf(NotFoundException);
    expect(confirmed).toHaveLength(0); // never reached the payments service
  };
  const expectEnabled = async (): Promise<void> => {
    // enabled → gate passes, the request reaches the (stub) payments service
    const res = await controller.mmResolve({ intentId: 'intent-1', outcome: 'CONFIRMED' });
    expect(res).toEqual({ intentId: 'intent-1', outcome: 'CONFIRMED' });
    expect(confirmed).toContain('intent-1');
  };

  it('DISABLED by default in a real deployment (IDENTITY_MODE=platform, DEV_AUTH unset)', async () => {
    setEnv(undefined, 'platform');
    await expectDisabled();
  });

  it('ENABLED for local/stub dev (IDENTITY_MODE unset, DEV_AUTH unset)', async () => {
    setEnv(undefined, undefined);
    await expectEnabled();
  });

  it('DEV_AUTH=on force-enables even under platform mode (dev payments demo)', async () => {
    setEnv('on', 'platform');
    await expectEnabled();
  });

  it('DEV_AUTH=off is a hard kill even in stub mode', async () => {
    setEnv('off', undefined);
    await expectDisabled();
  });
});
