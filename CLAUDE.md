# CLAUDE.md — BiasharaPOS Appliances & Electronics Platform

Start every session by reading **`CONTEXT.md`** (one-page state snapshot), then work the next unchecked task in **`PLAN.md`** following the build loop below. `ARCHITECTURE.md` is binding; `DECISIONS.md` explains why things are the way they are. Design values come only from `DESIGN_SYSTEM.md` + `design-handoff/` tokens.

## Build loop (per task — do not skip steps)
1. Pick the smallest next unchecked task in `PLAN.md` whose dependencies are met; state intent in one sentence.
2. Implement the smallest correct version — no gold-plating, nothing beyond the task.
3. Verify per the task's *Verify:* clause. Done means verified, not written.
4. Append to `PROGRESS.md`; check the box in `PLAN.md`; log non-obvious choices in `DECISIONS.md`; refresh `CONTEXT.md` if state changed materially. Commit per task.
5. Surprises: small → decide + log; medium → add task to `PLAN.md`; big (breaks ARCHITECTURE.md) → STOP and re-enter architect mode. Never silently redesign.

## Commands
```bash
npm ci
npm run build --workspace packages/shared   # always build shared first
npm run lint && npm run build && npm test
# DB (Postgres 16, D-020): dev/prod = Neon project biashara-appliances (branch-per-env);
# dev URL in gitignored apps/api/.env (read by dev/start). Tests + offline work use
# localhost (embedded PG per D-017, or createdb biashara_appliances role biashara/biashara):
export DATABASE_URL=postgres://biashara:biashara@localhost:5432/biashara_appliances
npm run migrate -w apps/api && npm run seed -w apps/api   # migrate:down to revert
node apps/api/dist/main.js                  # API on :3000, healthcheck GET /api/health
npm run dev:pos                              # POS shell :5173 · dev:backoffice :5174
```

## Hard rules
- **Money is integer TZS.** No floats, no decimals, ever. Ledger corrections are reversing entries, never mutations.
- **Serialized unit states change only through the state machine** (T1.3); every transition is audit-logged.
- **Schema changes only via handwritten SQL migrations** (TypeORM, `synchronize:false`). Do NOT use Prisma (engines blocked on restricted networks, D-014).
- **Platform services (fiscal, payments, identity, SMS) are ports** defined in `packages/shared`; domain code never imports their SDKs. Stubs until M5 (D-004).
- **No hex/spacing literals in feature code** — tokens only (from T0.6). Canonical palette: azure blue `#0F5DA4` primary, green `#239B46` CTA/money, gold `#E7A52C` accent, Steel Blue `#1D6A96` sub-brand; typeface Plus Jakarta Sans (D-015). Logo = `brand/*.svg` (D-016).
- **Bilingual Swahili + English** from the start; every payment produces a TRA VFD fiscal receipt via the FiscalService port.

## Layout
npm workspaces: `apps/api` (NestJS 11, plain tsc — no Nest CLI), `apps/pos` (React PWA), `apps/backoffice` (React SPA), `packages/shared` (domain types + frozen adapter contracts), `packages/ui` (tokens + components, arrives T0.6), `design-handoff/` (canonical design source — read-only), `brand/` (canonical logos).
