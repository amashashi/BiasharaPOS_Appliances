/**
 * Offline outbox (T5.5): cash sales made while disconnected are queued in
 * IndexedDB with a client-generated `clientRef` and replayed to /sync/outbox on
 * reconnect. The server dedupes by clientRef, so replay is exactly-once — a
 * double-drain never double-charges.
 */

export interface OutboxOp {
  clientRef: string;
  locationId: string;
  customer?: { name: string; phone?: string };
  /** unitPriceTzs = the price shown offline (stale-price check on replay, T5.6); serials = scanned units (serial-conflict check). */
  lines: Array<{ productId: string; qty: number; unitPriceTzs: number; serials?: string[] }>;
  payment: { amountTzs: number };
}

export interface OutboxItem {
  clientRef: string;
  op: OutboxOp;
  queuedAt: number;
}

/** Storage seam so the drain orchestration is testable without IndexedDB. */
export interface OutboxStore {
  all(): Promise<OutboxItem[]>;
  put(item: OutboxItem): Promise<void>;
  remove(clientRef: string): Promise<void>;
  count(): Promise<number>;
}

export interface SyncResult {
  clientRef: string;
  status: 'created' | 'duplicate' | 'failed';
  error?: string;
}
export type SyncFn = (operations: OutboxOp[]) => Promise<{ results: SyncResult[] }>;

export const makeClientRef = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.round(Math.random() * 1e9)}`; // fallback (not used in browsers)

const DB_NAME = 'biashara-pos';
const STORE = 'outbox';

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: 'clientRef' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const tx = <T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> =>
  openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const store = db.transaction(STORE, mode).objectStore(STORE);
        const req = fn(store);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );

/** The real IndexedDB-backed store used by the POS. */
export const idbOutbox: OutboxStore = {
  all: () => tx<OutboxItem[]>('readonly', (s) => s.getAll() as IDBRequest<OutboxItem[]>),
  put: (item) => tx('readwrite', (s) => s.put(item)).then(() => undefined),
  remove: (clientRef) => tx('readwrite', (s) => s.delete(clientRef)).then(() => undefined),
  count: () => tx<number>('readonly', (s) => s.count()),
};

let draining: Promise<{ synced: number; failed: number }> | null = null;

/**
 * Replay every queued sale, once. Single-flight: overlapping calls (an 'online'
 * event firing while a drain is already running) share the in-flight run, so no
 * operation is posted twice. On a successful POST each processed op is removed
 * (created/duplicate = done; failed = server-rejected, won't succeed on retry —
 * removed so it can't loop, T5.6 will queue these for a human). A network
 * failure leaves everything queued for the next reconnect.
 */
export function drainOutbox(store: OutboxStore, sync: SyncFn): Promise<{ synced: number; failed: number }> {
  if (draining) return draining;
  draining = (async () => {
    const items = await store.all();
    if (items.length === 0) return { synced: 0, failed: 0 };
    const { results } = await sync(items.map((i) => i.op)); // network error → throws, nothing removed
    let synced = 0;
    let failed = 0;
    for (const r of results) {
      if (r.status === 'failed') failed += 1;
      else synced += 1;
      await store.remove(r.clientRef); // processed either way — never re-post
    }
    return { synced, failed };
  })().finally(() => {
    draining = null;
  });
  return draining;
}
