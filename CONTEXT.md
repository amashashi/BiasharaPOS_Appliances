# Context — BiasharaPOS Appliances & Electronics Platform

> One-page cold-start snapshot. Read this first; a minute here replaces the whole conversation history.

**Last refreshed:** 2026-07-16 (building on the user's Windows machine, Claude Code)

## What this is
Independent SaaS platform for **appliance & electronics retailers in Tanzania** — a new vertical product in the BiasharaPOS family, built as its own codebase that borrows the platform services (TRA VFD fiscalization, mobile money, identity, SMS) via API adapters. V1 = the three things generic POS can't do: **serialized inventory, the scheduled sale (deposit → delivery → installation), and the installment/layaway credit ledger** (digitized "mali kauli"). Docs: `PROJECT_BRIEF.md` → `ARCHITECTURE.md` → `PLAN.md` (approved 2026-07-15) → `DECISIONS.md` → `DESIGN_SYSTEM.md` (v2). Deeper history (market research, brainstorm) lives in the claude.ai project "Home Appliance and Electroni POS".

## Where we are
- **M0 COMPLETE** (T0.1–T0.7: scaffold+CI, data layer, adapter contracts+stubs, auth guard, audit log, design tokens+ui, brand assets).
- **T1.1 DONE** — Catalog module: products table + CRUD (OWNER writes, any-auth reads, soft archive) + CSV import with per-row `{line, errors[]}` reporting (D-018); 50-row fixture at `apps/api/test/fixtures/products-sample-50.csv`.
- **T1.2 DONE** — InventoryModule: `POST /grns` receives stock atomically (all-or-nothing, D-019), one `SerializedUnit(IN_STOCK)` per serial, `UNIQUE(merchantId, serial)`, duplicate serials rejected naming each offender + field path; GRN provenance readable via `GET /grns/:id`.
- **T1.3 DONE** — `UnitStateService.transition()` is THE only way to change `serialized_units.status` (FOR UPDATE lock, legal-graph check, status+audit in one transaction; illegal → 409, logs nothing; no shortcut edges — direct sale = RESERVE then SELL, D-021).
- **T1.4 DONE** — `GET /stock` (product × location status counts, filters) + `GET /units/lookup?serial=` (unit + GRN provenance + full actor-attributed history); any-authenticated reads. UI deferred to T6.1 (D-022).
- **T1.5 DONE — M1 COMPLETE** — `products.isSerialized` (immutable once stock exists) + `stock_levels` qty ledger; mixed GRNs (serials[] vs qty per line, type-shaped validation); stock view shows both models. 84 tests green. Neon production + development branches both migrated through 1784160000000 (prod applied 2026-07-16 with explicit owner go).
- Conventions (from vitest/esbuild having no decorator metadata): explicit types on every `@Column`; **explicit `@Inject(token)` on every constructor param**; DI tokens live in `tokens.ts` files, never in module files (CJS circular-import trap, see T1.1 surprises).
- **T2.1 DONE (M2 begins)** — OrdersModule: customers + sales orders (per-merchant sequential numbers), QUOTE/ORDER creation with inline customer, service lines, single-door lifecycle (`order-state.ts`, full ARCHITECTURE graph), computed totals, quote PDF via pdfkit + `@biashara/ui/tokens` (D-023). 91 tests green. ⚠️ Neon prod still needs migration 1784170000000 (dev is current; per-action rule — ask owner or apply at deploy).
- **➡ Next action: T2.2** — Serial reservation & pick: reserve specific serials at order time OR defer; pick at fulfillment; release on cancel. Uses UnitStateService + OrdersService.transition (both accept external EntityManager).

## The plan in one breath
M0 foundations & contracts → M1 serialized inventory → M2 scheduled sales + POS checkout (stub fiscal) → M3 installment/layaway ledger → M4 delivery → M5 swap stubs for real platform APIs + offline outbox → M6 back office, i18n, design-partner UAT (30-day pilot gate).

## Repo & environment
- **GitHub: `amashashi/BiasharaPOS_Appliances`** (user's working copy: `C:\BiasharaPOS_Appliances`). GitHub live since e613305 (user pushed). Update flow: bundle → user `git pull claude-history.bundle main` → `git push`.
- npm workspaces: `apps/api` (NestJS 11, plain tsc, prefix `/api`), `apps/pos` (:5173 PWA shell), `apps/backoffice` (:5174), `packages/shared`, `packages/ui`.
- Commands: `npm ci` → `npm run build --workspace packages/shared` → `npm run lint` / `npm run build` / `npm test`; `npm run migrate | migrate:down | seed -w apps/api`.
- **Databases (D-020):** Neon project `biashara-appliances` (`green-unit-19592753`, eu-central-1, PG16) with branch-per-environment — `production` (URL only in deploy env vars; nothing deployed yet) and `development` (URL in gitignored `apps/api/.env`, read by `npm run dev/start`; both branches migrated, dev seeded 2026-07-16). **Tests default to localhost** (vitest doesn't read `.env`): embedded Postgres 16.13 under `~/.biashara-devdb` (D-017) — start from PowerShell, NOT git-bash: `& "$env:USERPROFILE\.biashara-devdb\node_modules\@embedded-postgres\windows-x64\native\bin\pg_ctl.exe" -D "$env:USERPROFILE\.biashara-devdb\data" -l "$env:USERPROFILE\.biashara-devdb\pg.log" start`. CI uses its `postgres:16` service; docker-compose for machines with a daemon.

## Watch out for
- **Prisma is unusable on restricted networks** (engine downloads blocked) — data layer is TypeORM with handwritten SQL migrations (D-014). Don't reintroduce Prisma.
- **Design source of truth** is `design-handoff/` (azure blue #0F5DA4 primary, green #239B46 CTA, gold accent, Plus Jakarta Sans) — NOT the v1 green-primary/Inter assumptions (D-015). Logo: repo `brand/*.svg` are canonical (D-016). No hex literals in feature code once T0.6 lands.
- Money = integer TZS only; serial state changes only through the state machine; every payment fiscalizes via the FiscalService port (per-payment assumption, D-008 provisional).
- Sessions now run directly on the user's machine: commits work normally (the old `.git/index.lock` cowork-bridge quirk is gone; no lock present as of 2026-07-16). Pushes still run by the user.

## Open items owned by the human
1. `git push origin main` (local commits from 2026-07-16 onward).
2. TRA compliance ruling on installment fiscalization (blocks T5.2 only).
3. Dealer validation workstream (existing-customer evidence + Kariakoo shop visits).
