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

## 2026-07-15 — Repo relocated to GitHub-linked device folder + design handoff adopted

**Done:** Synced the repo (47 tracked files) to `C:\BiasharaPOS_Appliances` (GitHub: amashashi/BiasharaPOS_Appliances) and committed there (`68a95fc`) on top of the repo's initial commit. Discovered the official **design handoff zip** in that folder; vendored it at `design-handoff/`; rewrote `DESIGN_SYSTEM.md` to v2 (Azure Blue primary, green CTA, gold accent, Plus Jakarta Sans; sub-brand Steel Blue + status vocabulary + green power-bolt mark ratified) → D-015. T0.6 must transcribe tokens from `design-handoff/_ds/*/tokens/*.css` and bundle the Plus Jakarta Sans TTFs.

**Blocked on device:** `.git/index.lock` left behind on the device repo cannot be deleted through the bridge (no-delete limitation) — device-side git commits are blocked until the user deletes `C:\BiasharaPOS_Appliances\.git\index.lock` manually. Push to GitHub must also run from the user's machine (workspace VM has no network). Container repo remains the working copy; sync to device at checkpoints.

## 2026-07-15 — GitHub push attempts + history hygiene (between T0.2 and T0.3)

**Findings:** Sandbox GitHub gateway allows reads but binds writes to session-configured repos — pushes 403 regardless of PAT (user's token revoke-recommended; deleted from container). Device-folder `.git` further degraded (object store gutted, stale HEAD.lock) — declared dead; recovery = fresh `claude-history.bundle` placed in the folder (post-merge, corrected identities) + five PowerShell commands (delete 2 locks, fetch bundle, checkout -B, plain push). History rewritten once (user-authorized): all Claude commits now author+committer `noreply@anthropic.com`; user's `c7fe31c` untouched and merged in (no force-push needed). Remaining stop-hook "Unverified" flag is the unfixable missing-signature condition — accepted.

## 2026-07-15 — T0.3 Platform adapter contracts + stubs ✅

**Done:** Frozen contracts in `packages/shared/src/contracts.ts` (D-004): `FiscalService` (issueReceipt with idempotencyKey; TRA VFD receipt shape), `PaymentsService` (initiateMobileMoneyPush for MPESA/MIXX_BY_YAS/AIRTEL_MONEY + PaymentConfirmation webhook payload), `IdentityService` (verifyToken → AuthContext), `NotificationService` (sendSms templated, bilingual). Stub implementations in `apps/api/src/platform/stubs/` (sequential VFD numbers + idempotency + failNext() outage simulation; intent registry + webhook-style confirm/fail; HS256 JWT verify with sign() test helper; SMS send log). NestJS `PlatformModule` binds stubs via injection tokens (FISCAL_SERVICE etc.), imported by AppModule.

**Verified:** 8 new contract tests + health test = 9/9 passing; shared + api builds green; lint green after excluding vendored `design-handoff/**` from ESLint (minified bundle was producing 1179 errors — config fix, not code).

**Note:** contract shapes derived from ARCHITECTURE.md; confirm against real platform API docs before M5 swap-in (audit note in contracts.ts header).

## 2026-07-15 — T0.4 Auth middleware + role guards ✅

**Done:** Global `AuthGuard` (APP_GUARD in AppModule): validates `Authorization: Bearer` JWTs through the `IDENTITY_SERVICE` port, attaches `AuthContext` to the request (`AuthedRequest`), enforces `@Roles(...)` metadata (OWNER/CASHIER/DELIVERY), `@Public()` opt-out used on the healthcheck. Decorators in `src/auth/decorators.ts`.

**Verified:** 4 integration tests (supertest against a real Nest app): public route 200 with no token; missing/garbage token 401; valid token attaches merchantId/userId; cashier 403 on @Roles('OWNER') route while owner 200. Full suite 13/13; lint green; live smoke test confirms `/api/health` still public on the built app.

## 2026-07-15 — T0.5 Append-only audit log ✅

**Done:** `audit_events` table (migration 1784130000000) with a **database trigger** rejecting UPDATE/DELETE (`audit_events is append-only`) — immutability holds regardless of role or code path. `AuditSubscriber` (TypeORM) auto-records INSERT/UPDATE/REMOVE for every entity in the same transaction (recursion-guarded); `AuditService.record()` for actor-attributed domain verbs (UNIT_SOLD etc.). Global `DbModule` provides the initialized DataSource (`DATA_SOURCE` token) + AuditService to the app; API scripts use `--env-file-if-exists=.env`; CI gained a postgres:16 service so DB tests run there.

**Verified (against real Postgres):** creating a Merchant auto-writes an INSERT audit row; updating records before+after; raw SQL UPDATE and DELETE on audit_events both rejected by the trigger. Full suite 16/16, lint + build green.

**Surprises:** (1) TypeORM `insert()` generics reject `Record<string,unknown>|null` jsonb payloads → switched audit writes to `create()+save()`. (2) Vitest/esbuild doesn't emit decorator metadata → all entity `@Column()`s now declare explicit types (also makes schema intent visible; keep this convention for every future entity).

## 2026-07-15 — T0.6 Design tokens + packages/ui foundation ✅

**Done:** `packages/ui` — `tokens.ts` transcribed exactly from the design handoff (core palette blue/green/gold/cyan + neutrals, Steel Blue sub-brand, Plus Jakarta Sans stacks, type scale, 4px spacing scale, radii, shadows, motion, layout) plus the domain status vocabulary (`unitStatusStyle`, `arrearsStyle` ramp). Components: Button (primary/secondary/danger/ghost, `pos` 48px variant), MoneyDisplay + `formatTzs` (integer-only, tabular-nums), StatusBadge (unit + arrears, bilingual), SerialChip (steel pill, copy + lookup), OfflineBar (queued=gold / conflicts=red, hidden when synced). Bilingual `i18n.ts` (Swahili-first). Plus Jakarta Sans variable TTFs bundled + `fonts.css` export (self-hosted for offline POS). ESLint rule bans raw hex in `apps/**` and ui components (tokens.ts is the sanctioned home). Back-office shell now renders a Showcase page (sw/en toggle); POS shell restyled from tokens.

**Verified:** 4 token/i18n/format tests (20 total green); lint green; hex fixture file correctly rejected by the new rule ("Raw hex color…"); Chromium screenshots of the Showcase in both locales confirm palette, CTA shadow, tabular money alignment, status vocabulary incl. the 3-step arrears ramp, serial chips, offline bar.

**Surprise:** a `*/` inside a doc-comment glob path terminated the comment block — reworded (watch for this in comments referencing glob paths).

## 2026-07-15 — T0.7 Brand assets integration ✅ — **M0 COMPLETE**

**Done:** PNG icon set (32/192/512) rendered from the canonical `brand/logo-appliances-icon.svg` (D-016); PWA manifest now declares png + svg icons; SVG+PNG favicons in both apps; POS shell renders the full lockup; Showcase header carries the mark; `receiptHeaderHtml()` in packages/ui — self-contained 80mm header (inlined icon, merchant name/TIN/location, sub-brand line; VFD QR reserved for the footer in T2.4) previewed in the Showcase.

**Verified:** builds/lint/tests green; manifest fetch lists `/icons/icon-192.png, /icons/icon-512.png, /logo-icon.svg`; Chromium screenshots confirm the branded POS shell and Showcase header.

**Milestone note:** GitHub is now live — user re-initialized the folder from the fresh bundle and pushed successfully (`c7fe31c..e613305 main`). Update flow until a push-capable session exists: Builder drops `claude-history.bundle` in the folder → user runs `git pull claude-history.bundle main` → `git push`.

## 2026-07-16 — T1.1 Catalog module: Product CRUD + CSV import ✅ (M1 begins)

**Done:** `products` table (migration 1784140000000: FK merchant, partial-unique `(merchantId, sku)` where sku present, price/cost CHECKs, brand+model index) + `Product` entity (explicit column types per convention). `CatalogModule`: OWNER-gated create/update/archive + import, any-authenticated read. One validation source (`product.rules.ts`) feeds both CRUD bodies and CSV rows → identical per-field errors; taxCode A–E (TRA VFD groups, blank→A), integer-TZS-only prices. Zero-dependency RFC-4180 CSV parser (`csv.ts`: quotes, escaped quotes, CRLF, BOM). Import: header matched by name case-insensitively, every valid row imports, every bad row reported as `{line, errors[]}` (validation, in-file sku dupes, DB sku dupes) — one bad row never blocks the file. DELETE = soft archive (`active=false`); default list hides archived. JSON body limit raised to 2mb in main.ts for `{csv}` payloads. Shared gains `TaxCode`/`TAX_CODES`. Fixture: `apps/api/test/fixtures/products-sample-50.csv` (50 realistic TZ appliance rows incl. quoted commas).

**Verified (real Postgres):** 16 new tests (6 CSV parser unit, 10 supertest integration) — create normalizes + defaults taxCode; per-field 400s; CASHIER read-only (403 on write); merchant scoping (cross-merchant 404, same sku ok across merchants); archive semantics; **50-row sample imports with `{totalRows:50, imported:50, errors:[]}`**; engineered bad file reports errors keyed by exact file line (missing brand, decimal price, bad taxCode, in-file dupe, exists-in-DB dupe) while importing the good rows; header/`{csv}` guards 400. Full suite 36/36, lint + both builds green, migrate down/up clean, live smoke-boot on :3999 created a product end-to-end.

**Surprises:** (1) `DATA_SOURCE` token lived in `db.module.ts` while `AuditService` imported it from there — a latent CJS circular import that left the token `undefined` once CatalogModule joined the graph (API refused to boot). Token moved to `src/db/tokens.ts` (mirrors `platform/tokens.ts`); importers updated. **Convention: DI tokens never live in module files.** (2) Constructor injection *by type* also dies under vitest's esbuild (no `design:paramtypes`) — CatalogController now uses explicit `@Inject(CatalogService)`; extend the T0.5 convention: **every constructor injection uses an explicit `@Inject(token)`**. (3) Dev machine had no Postgres/Docker and apt is TLS-intercepted; stood up Postgres 16.13 via npm-delivered binaries (`@embedded-postgres/windows-x64`) under `~/.biashara-devdb`, role/db per project defaults — see D-017.
