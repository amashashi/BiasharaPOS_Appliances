# Progress — BiasharaPOS Appliances & Electronics Platform

> Builder log. Newest at bottom. Each entry: what was done, how it was verified, surprises.

## 2026-07-15 — T0.1 Monorepo scaffold + CI ✅

**Done:** npm-workspaces monorepo at repo root: `apps/api` (NestJS 11, tsc build, `GET /api/health`), `apps/pos` (Vite+React PWA shell, manifest, port 5173), `apps/backoffice` (Vite+React shell, port 5174), `packages/shared` (frozen domain types: UUID, Tzs, UnitStatus, OrderStatus, PaymentMethod, CreditAgreement types, Role). Root ESLint 9 flat config (ts-eslint), Vitest per workspace, GitHub Actions CI (`.github/workflows/ci.yml`), `docker-compose.yml` (postgres + api) with `apps/api/Dockerfile`. Git repo initialized, first commit `5548d70`.

**Verified:** `npm run build` green across all workspaces; `npm run lint` green; `npm test` — 1/1 passing (health controller); API started and `curl /api/health` returned `{"status":"ok","service":"biashara-appliances-api","version":"0.1.0"}`; POS preview served correct `<title>`.

**Surprises / adaptations:**
- **Docker daemon unavailable in this sandbox** (compose file cannot be run here). Local PostgreSQL 16 cluster exists and will be used for DB verification from T0.2 onward. docker-compose remains the contract for dev machines/CI. → logged as D-012.
- eslint config renamed to `.mjs` to silence module-type warning.

## 2026-07-15 — T0.2 PostgreSQL + migrations + base entities ✅

**Done:** TypeORM + pg data layer in `apps/api`: entities `Merchant`, `Location` (SHOP/WAREHOUSE, unique per merchant+name), `UserRef` (platform-identity mapping + role, per D-004); handwritten SQL migration `1784120000000-base-entities`; `createDataSource()` with `synchronize: false`; runner scripts `npm run migrate` / `migrate:down` / `seed` (idempotent demo merchant "Demo Electronics Ltd" + Kariakoo Showroom + Ubungo Warehouse + owner user). `.env.example` added.

**Verified:** migrate up → seed → migrate **down** → migrate up → re-seed all clean; psql join query returns the 2 seeded locations under the merchant; root lint + tests still green.

**Surprises:** Prisma engine downloads 403-blocked by sandbox allowlist → switched to TypeORM per D-003's sanctioned alternative (D-014). No Nest wiring of the DataSource yet — first consumer arrives with T0.5 (audit table) and M1 modules.
