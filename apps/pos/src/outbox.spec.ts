import { describe, expect, it, vi } from 'vitest';
import { drainOutbox, type OutboxItem, type OutboxStore, type SyncFn } from './outbox.js';

/** In-memory store so the drain orchestration is testable without IndexedDB. */
const memStore = (items: OutboxItem[]): OutboxStore => {
  const map = new Map(items.map((i) => [i.clientRef, i]));
  return {
    all: async () => [...map.values()],
    put: async (i) => void map.set(i.clientRef, i),
    remove: async (ref) => void map.delete(ref),
    count: async () => map.size,
  };
};
const item = (clientRef: string, amountTzs: number): OutboxItem => ({
  clientRef,
  op: { clientRef, locationId: 'loc', lines: [{ productId: 'p', qty: 1, unitPriceTzs: amountTzs }], payment: { amountTzs } },
  queuedAt: 0,
});

describe('outbox drain (T5.5)', () => {
  it('posts all queued ops and removes the ones the server acknowledged', async () => {
    const store = memStore([item('a', 1), item('b', 2)]);
    const sync: SyncFn = async (ops) => ({ results: ops.map((o) => ({ clientRef: o.clientRef, status: 'created' as const })) });

    const res = await drainOutbox(store, sync);
    expect(res).toEqual({ synced: 2, failed: 0 });
    expect(await store.count()).toBe(0);
  });

  it('is single-flight: overlapping drains post exactly once (no double-charge)', async () => {
    const store = memStore([item('a', 1), item('b', 2)]);
    let calls = 0;
    const sync: SyncFn = async (ops) => {
      calls += 1;
      await new Promise((r) => setTimeout(r, 20));
      return { results: ops.map((o) => ({ clientRef: o.clientRef, status: 'created' as const })) };
    };
    const [r1, r2] = await Promise.all([drainOutbox(store, sync), drainOutbox(store, sync)]);
    expect(calls).toBe(1); // the second call joined the in-flight run
    expect(r1).toBe(r2); // same shared promise result
    expect(await store.count()).toBe(0);
  });

  it('a network failure leaves everything queued for the next reconnect', async () => {
    const store = memStore([item('a', 1)]);
    const sync: SyncFn = () => Promise.reject(new Error('offline'));
    await expect(drainOutbox(store, sync)).rejects.toThrow('offline');
    expect(await store.count()).toBe(1); // nothing removed
  });

  it('removes server-rejected ops so they cannot loop, and counts them as failed', async () => {
    const store = memStore([item('good', 1), item('bad', 2)]);
    const sync: SyncFn = async () => ({
      results: [
        { clientRef: 'good', status: 'created' as const },
        { clientRef: 'bad', status: 'failed' as const, error: 'no lines' },
      ],
    });
    const res = await drainOutbox(store, sync);
    expect(res).toEqual({ synced: 1, failed: 1 });
    expect(await store.count()).toBe(0);
  });

  it('an empty outbox is a no-op (no POST)', async () => {
    const store = memStore([]);
    const sync = vi.fn<SyncFn>();
    const res = await drainOutbox(store, sync);
    expect(res).toEqual({ synced: 0, failed: 0 });
    expect(sync).not.toHaveBeenCalled();
  });
});
