import { Global, Module, OnApplicationShutdown, Inject } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import { createDataSource } from './data-source.js';
import { AuditService } from './audit.service.js';

export const DATA_SOURCE = Symbol('DATA_SOURCE');

/** Global DB module: one initialized DataSource + the audit helper. */
@Global()
@Module({
  providers: [
    {
      provide: DATA_SOURCE,
      useFactory: async (): Promise<DataSource> => {
        const ds = createDataSource();
        await ds.initialize();
        return ds;
      },
    },
    AuditService,
  ],
  exports: [DATA_SOURCE, AuditService],
})
export class DbModule implements OnApplicationShutdown {
  constructor(@Inject(DATA_SOURCE) private readonly ds: DataSource) {}

  async onApplicationShutdown(): Promise<void> {
    if (this.ds.isInitialized) await this.ds.destroy();
  }
}
