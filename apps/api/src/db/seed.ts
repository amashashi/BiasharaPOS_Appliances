/* Demo seed: node dist/db/seed.js — idempotent */
import { createDataSource } from './data-source.js';
import { Merchant } from './entities/merchant.entity.js';
import { Location } from './entities/location.entity.js';
import { UserRef } from './entities/user-ref.entity.js';

async function main(): Promise<void> {
  const ds = createDataSource();
  await ds.initialize();
  try {
    const merchants = ds.getRepository(Merchant);
    let demo = await merchants.findOneBy({ name: 'Demo Electronics Ltd' });
    if (!demo) {
      demo = await merchants.save(
        merchants.create({ name: 'Demo Electronics Ltd', tin: '123-456-789', phone: '+255700000001' }),
      );
    }
    const locations = ds.getRepository(Location);
    for (const [name, kind] of [
      ['Kariakoo Showroom', 'SHOP'],
      ['Ubungo Warehouse', 'WAREHOUSE'],
    ] as const) {
      const exists = await locations.findOneBy({ merchantId: demo.id, name });
      if (!exists) await locations.save(locations.create({ merchantId: demo.id, name, kind }));
    }
    const users = ds.getRepository(UserRef);
    const owner = await users.findOneBy({ merchantId: demo.id, platformUserId: 'platform-user-demo-owner' });
    if (!owner) {
      await users.save(
        users.create({
          merchantId: demo.id,
          platformUserId: 'platform-user-demo-owner',
          displayName: 'Demo Owner',
          role: 'OWNER',
        }),
      );
    }
    // eslint-disable-next-line no-console
    console.log(`seeded merchant ${demo.id} with ${await locations.countBy({ merchantId: demo.id })} locations`);
  } finally {
    await ds.destroy();
  }
}

void main();
