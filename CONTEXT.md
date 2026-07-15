# Context — BiasharaPOS Appliances & Electronics Platform

> One-page cold-start snapshot. Read this first; a minute here replaces the whole conversation history.

**Last refreshed:** 2026-07-15 (handoff: Cowork → Claude Code cloud)

## What this is
Independent SaaS platform for **appliance & electronics retailers in Tanzania** — a new vertical product in the BiasharaPOS family, built as its own codebase that borrows the platform services (TRA VFD fiscalization, mobile money, identity, SMS) via API adapters. V1 = the three things generic POS can't do: **serialized inventory, the scheduled sale (deposit → delivery → installation), and the installment/layaway credit ledger** (digitized "mali kauli"). Docs: `PROJECT_BRIEF.md` → `ARCHITECTURE.md` → `PLAN.md` (approved 2026-07-15) → `DECISIONS.md` → `DESIGN_SYSTEM.md` (v2). Deeper history (market research, brainstorm) lives in the claude.ai project "Home Appliance and Electroni POS".

## Where we are
- **M0 in progress.** T0.1 ✅ scaffold+CI · T0.2 ✅ data layer · T0.3 ✅ adapter contracts+stubs · T0.4 ✅ auth guard+roles (13 tests green).
- **➡ Next action: T0.5** — append-only audit-event table + helper (immutability enforced), T0.6 design tokens (transcribe from `design-handoff/_ds/*/tokens/*.css`, bundle Plus Jakarta Sans TTFs), T0.7 brand assets (canonical SVGs in `brand/`, D-016).

## The plan in one breath
M0 foundations & contracts → M1 serialized inventory → M2 scheduled sales + POS checkout (stub fiscal) → M3 installment/layaway ledger → M4 delivery → M5 swap stubs for real platform APIs + offline outbox → M6 back office, i18n, design-partner UAT (30-day pilot gate).

## Repo & environment
- **GitHub: `amashashi/BiasharaPOS_Appliances`** (user's working copy: `C:\BiasharaPOS_Appliances`). Device folder synced through commit `68a95fc`; later commits (`a21e00b`+, design-handoff adoption) still need syncing to device/GitHub.
- npm workspaces: `apps/api` (NestJS 11, plain tsc, prefix `/api`), `apps/pos` (:5173 PWA shell), `apps/backoffice` (:5174), `packages/shared`. `packages/ui` arrives in T0.6.
- Commands: `npm ci` → `npm run build --workspace packages/shared` → `npm run lint` / `npm run build` / `npm test`. DB: Postgres 16, `DATABASE_URL=postgres://biashara:biashara@localhost:5432/biashara_appliances`, then `npm run migrate | migrate:down | seed -w apps/api`. docker-compose for environments with a daemon.

## Watch out for
- **Prisma is unusable on restricted networks** (engine downloads blocked) — data layer is TypeORM with handwritten SQL migrations (D-014). Don't reintroduce Prisma.
- **Design source of truth** is `design-handoff/` (azure blue #0F5DA4 primary, green #239B46 CTA, gold accent, Plus Jakarta Sans) — NOT the v1 green-primary/Inter assumptions (D-015). Logo: repo `brand/*.svg` are canonical (D-016). No hex literals in feature code once T0.6 lands.
- Money = integer TZS only; serial state changes only through the state machine; every payment fiscalizes via the FiscalService port (per-payment assumption, D-008 provisional).
- Cowork-bridge quirk: `.git/index.lock` at `C:\BiasharaPOS_Appliances` must be deleted by the user before device-side commits; pushes run from the user's machine.

## Open items owned by the human
1. Delete `C:\BiasharaPOS_Appliances\.git\index.lock`, then `git push origin main`.
2. TRA compliance ruling on installment fiscalization (blocks T5.2 only).
3. Dealer validation workstream (existing-customer evidence + Kariakoo shop visits).
