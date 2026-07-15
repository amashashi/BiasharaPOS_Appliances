# Design System — BiasharaPOS Appliances & Electronics Platform

> **v2 — reconciled against the official design handoff** (`BiasharaPOS Appliances Design System.zip` at repo root, received 2026-07-15). The handoff bundle is the canonical source: its `tokens/*.css` files define exact values, its `Appliances Design System.dc.html` is the high-fidelity visual reference, and its `assets/fonts/` ships the brand typeface. This document is the implementation guide for `packages/ui`; where it and the handoff disagree, **the handoff wins**.

**Status:** Approved (aligned to hifi handoff)
**Last updated:** 2026-07-15
**Inherits from:** BiasharaPOS core brand (logo-sampled canonical palette, Plus Jakarta Sans, flat/minimal card style, "Smart Business · Seamless Sales")

---

## 1. Brand foundation (inherited — corrected in v2)

| Element | Value | Notes |
|---|---|---|
| Primary brand | `#0F5DA4` (Azure Blue) | Dominant brand color — headers, links, brand moments ("Biashara") |
| Secondary brand | `#239B46` (Emerald Green) | Primary CTA, money/profit, success ("Smart Business") |
| Brand accent | `#E7A52C` (Warm Gold) | Highlights, "popular", upward arrows ("POS") |
| Gradient companion | `#2FAEE4` (Cyan) | Used inside brand gradients only |
| Typeface | **Plus Jakarta Sans** (300–800 + italic; variable TTFs in handoff `assets/fonts/`) | One family; headings heavy (800), tightly tracked; body relaxed |
| Style | Flat, minimal, card-based, generous whitespace | Cool neutrals chosen to sit beside the blue |

> v1 of this document assumed green-primary and Inter; the handoff corrects both. The app's flatter working values (`#1A56A0`/`#1D9E75`) are superseded — logo-sampled website values are canonical per the handoff readme.

## 2. Color tokens

### 2.1 Core palette (from handoff `tokens/colors.css` — reproduce exactly)

| Token | Hex | Usage |
|---|---|---|
| `color.blue` (+ `-d #0C4A85`, `-dd #0A3A6B`, `-100 #CFE1F4`, `-50 #E8F1FA`) | `#0F5DA4` | Primary brand, headers, links |
| `color.green` (+ `-d #1B7C34`, `-dd #145F28`, `-100 #CCE9D4`, `-50 #E8F6EC`) | `#239B46` | Primary CTA, money, success |
| `color.gold` (+ `-l #F4B53E`, `-50 #FDF3E1`) | `#E7A52C` | Accent, highlights |
| `color.cyan` | `#2FAEE4` | Gradient companion |
| `color.ink` / `ink-2` / `ink-3` | `#13202C` / `#45525E` / `#7A8590` | Strong text / body / muted |
| `color.bg` / `surface` / `tint` | `#F6F8FB` / `#FFFFFF` / `#EEF4F6` | Page / cards / sunken sections |
| `color.line` / `line-2` | `#E4E8EE` / `#D4DAE2` | Hairlines / inputs |
| `color.red` (+ `-50 #FEF2F2`) | `#D85A30` | Destructive, errors, refunds |
| `color.amber` | `#BA7517` | Warning text, in-progress |

Semantic aliases (prefer in components): `brand.primary→blue`, `brand.secondary→green`, `brand.accent→gold`, `text.strong/body/muted→ink/ink-2/ink-3`, `surface.page/card/sunken→bg/surface/tint`.

### 2.2 Sub-brand extension (this platform's own)

| Token | Hex | Usage |
|---|---|---|
| `color.accent.steel` | `#1D6A96` | **Steel Blue — sub-brand accent**: descriptor line, serial/tech UI, category chips, informational banners |
| `color.accent.steel.tint` | `#E8F1F7` | Accent backgrounds |

### 2.3 Domain status colors (the platform's signature UI — retained from v1, ratified by handoff)

Fixed badge vocabulary used identically in POS, back office, and reports:

| State | Treatment |
|---|---|
| IN_STOCK | green-50 bg / green-d text |
| RESERVED | steel tint bg / steel text |
| SOLD | neutral (tint bg / ink-2 text) |
| DELIVERED | solid green badge, white text |
| RETURNED / FAILED | red-50 bg / red text |
| Arrears ramp | 1–7 days amber · 8–30 days red · >30 days solid red fill |
| Offline/queued | gold dot + "Inasubiri mtandao" |

## 3. Typography (from handoff `tokens/typography.css`)

- Family: `"Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", sans-serif`; mono stack for serials.
- Weights: 300/400/500/600/700/**800** (headings are 800, tightly tracked).
- Scale (px): display 76 (clamped) · h1 44 · h2 32 · h3 20 · lead 19 · body 15 · body-lg 16 (buttons/comfortable) · sm 13 · xs 11.5 (eyebrows, badges, table headers — 800 weight, letterspaced caps).
- **Money and serials: tabular-nums always**; format `TZS 1,250,000`, integers only.
- POS touch sizing: body-lg minimum on counter screens; primary buttons ≥48px tall.
- Bundle the variable TTFs from the handoff into `packages/ui/assets/fonts/` (self-hosted; no CDN dependency for offline-first POS).

## 4. Spacing, shape, elevation

Follow handoff `tokens/spacing.css` exactly when implementing. Working summary: 4/8/12/16/24/32/48 scale; radius 6 (inputs/badges), 10 (cards/buttons), 16 (sheets/dialogs), 999 (pills); flat borders by default, one raised shadow level for overlays; outline icons 1.5–1.9px stroke (handoff icons use Steel Blue stroke at 1.9).

## 5. Core components (implemented in `packages/ui`)

Unchanged from v1 — Button, MoneyDisplay (tabular TZS), StatusBadge (§2.3 vocabulary), SerialChip, Card/ListRow, ScheduleTable, PaymentMethodPicker (M-Pesa, Mixx by Yas, Airtel Money, Visa/Mastercard, cash), OfflineBar, Dialog/Sheet, Receipt & Statement print styles (80mm thermal + A4; VFD QR mandatory and never cropped; Swahili labels, English secondary). The handoff HTML composes the existing core BiasharaPOS primitives (Button, Badge, Icon) — **reuse those patterns; add only sub-brand components.** Recreate tokens/components natively in TypeScript (`packages/ui/tokens.ts`); do not copy the prototype HTML into production.

## 6. Sub-brand identity: logo & lockups

Ratified by the handoff (its hero mark matches this design): rounded square in Emerald Green containing a white power-arc with a lightning-bolt stem. The icon stays **green** even though core primary is blue — it reads as the family's action color. Descriptor "APPLIANCES & ELECTRONICS" in Steel Blue, letterspaced caps.

Files: `brand/logo-appliances-lockup.svg`, `brand/logo-appliances-icon.svg` (repo). The handoff's refined mark geometry (48-grid, stroked bolt) is an acceptable substitute; if regenerating assets, prefer the handoff geometry.

Usage rules unchanged from v1: minimum sizes (icon 24px, lockup 140px), clear space = power-symbol height, white/`bg` fields only, no gradients/shadows/stretching. Wordmark: "Biashara" in ink, "POS" in green.

## 7. Accessibility & localization

- Contrast ≥4.5:1 body text; green/gold only ≥18px or bold 14px+ on white; white text on solid blue/green passes.
- Swahili first-class: labels designed for Swahili length; `dd/MM/yyyy`; all templates (SMS, receipts, statements) bilingual. Voice per handoff: plain, direct, owner-to-owner, benefit-first.
- Color never the only signal — badge = color + label/icon. Full keyboard operability in back office; barcode-wedge input at POS.

## 8. Governance

- **Canonical source: the handoff bundle** (`tokens/*.css`, reference HTML). `packages/ui/tokens.ts` is generated/transcribed from it; no hex literals in feature code (lint-enforced, T0.6).
- Core palette/typography changes require the core BiasharaPOS brand owner; sub-brand tokens (Steel Blue, status vocabulary) are owned by this product.
- New components enter `packages/ui` only with both locales and both surfaces considered.
