# Context — BiasharaPOS Appliances & Electronics Platform

> Cold-start orientation for any session picking up this project. Refreshed by the Builder when state changes materially.

**Last refreshed:** 2026-07-15 (after T0.1)

## What this is
Independent SaaS platform for appliance & electronics retailers in Tanzania, sharing platform services (TRA VFD fiscalization, mobile money, identity, SMS) with the existing BiasharaPOS product via API adapters. V1 = serialized inventory + scheduled sales + installment/layaway ledger. Read `PROJECT_BRIEF.md` → `ARCHITECTURE.md` → `PLAN.md` (approved 2026-07-15) → `DECISIONS.md` → `DESIGN_SYSTEM.md`.

## Current state
- **Milestone:** M0 in progress. T0.1 + T0.2 done (scaffold, CI, healthcheck; TypeORM data layer with migrate/seed verified against local Postgres). Next: T0.3 (platform adapter contracts + stubs).
- **Repo layout:** npm workspaces — `apps/api` (NestJS 11, tsc, global prefix `/api`), `apps/pos` (Vite React PWA shell :5173), `apps/backoffice` (Vite React shell :5174), `packages/shared` (domain types + adapter contracts; build before api). `packages/ui` arrives in T0.6.
- **Commands:** `npm run build --workspace packages/shared` first, then `npm run lint` / `npm run build` / `npm test` at root. API: `node apps/api/dist/main.js` (PORT env, default 3000).

## Environment notes (this sandbox)
- Docker daemon unavailable → use local PostgreSQL 16 cluster (`service postgresql start`; cluster 16/main on :5432) for DB work; docker-compose.yml is for dev machines/CI.
- Git repo at project root; commit per task.

## Open items owned by the human
- TRA compliance answer on installment fiscalization (blocks T5.2 only).
- Confirm core BiasharaPOS typeface (design system assumes Inter).
- Dealer validation workstream (see brainstorm summary in claude.ai project).
