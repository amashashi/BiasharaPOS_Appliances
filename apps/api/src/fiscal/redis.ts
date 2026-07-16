/** Shared BullMQ connection options from REDIS_URL (default local Memurai/Redis). */
export function redisConnection(): { host: string; port: number; maxRetriesPerRequest: null } {
  const url = new URL(process.env.REDIS_URL ?? 'redis://localhost:6379');
  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    maxRetriesPerRequest: null, // required by BullMQ workers
  };
}

export const fiscalQueueName = (): string => process.env.FISCAL_QUEUE_NAME ?? 'fiscal';
