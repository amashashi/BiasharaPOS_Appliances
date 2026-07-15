# Design System — BiasharaPOS Appliances & Electronics Platform

> Inherits the **BiasharaPOS design system** (biashara-pos.com): flat, modern, minimalist; generous whitespace; card-based layouts; primary brand green. This document defines the inherited foundation, the sub-brand extensions specific to the Appliances & Electronics platform, and the component standards the Builder implements as the shared UI package (`packages/ui`).

**Status:** Draft (pending human approval, alongside PLAN.md)
**Last updated:** 2026-07-15
**Inherits from:** BiasharaPOS core brand (wordmark, primary green, flat/minimal style, "One POS. Every business" positioning)

---

## 1. Brand foundation (inherited)

| Element | Value | Notes |
|---|---|---|
| Primary brand color | `#239B46` (Biashara Green) | Inherited unchanged — the family identity |
| Brand style | Flat, minimal, card-based, generous whitespace | No gradients, no skeuomorphism, no drop-shadow heaviness |
| Wordmark | "Biashara**POS**" — name with stylized POS | Inherited; sub-brand adds a descriptor line (see §6) |
| Voice | Professional, accessible, plain-spoken; Swahili-first friendly | Tagline family: "Smart Business · Seamless Sales" |

## 2. Color tokens

### 2.1 Core palette

| Token | Hex | Usage |
|---|---|---|
| `color.primary` | `#239B46` | Primary actions, active states, brand moments |
| `color.primary.dark` | `#1B7A37` | Hover/pressed on primary, headers on receipts |
| `color.primary.tint` | `#E9F6EE` | Selected rows, subtle highlights, success backgrounds |
| `color.accent` | `#1D6A96` (Steel Blue) | **Sub-brand accent for Appliances & Electronics**: vertical identity, serial/tech UI accents, category chips, illustration line color |
| `color.accent.tint` | `#E8F1F7` | Accent backgrounds |
| `color.ink` | `#1F2937` | Primary text |
| `color.ink.muted` | `#6B7280` | Secondary text, labels |
| `color.surface` | `#FFFFFF` | Cards, sheets |
| `color.background` | `#F6F8F7` | App canvas |
| `color.border` | `#E5E7EB` | Dividers, input borders |

### 2.2 Semantic

| Token | Hex | Usage |
|---|---|---|
| `color.success` | `#239B46` | Payments confirmed, delivery completed (reuses primary) |
| `color.warning` | `#D97706` | Due soon, pending sync, aging stock |
| `color.danger` | `#DC2626` | Overdue/arrears, failed fiscalization, conflicts |
| `color.info` | `#1D6A96` | Informational banners (reuses accent) |

### 2.3 Domain status colors (this platform's signature UI)

Unit states (`SerializedUnit.status`) and money states get fixed badge colors — used identically in POS, back office, and reports so staff learn one language:

| State | Badge | Token |
|---|---|---|
| IN_STOCK | Green tint bg / green text | `primary.tint` / `primary.dark` |
| RESERVED | Blue tint bg / steel blue text | `accent.tint` / `accent` |
| SOLD | Ink tint bg / ink text | neutral |
| DELIVERED | Solid green check badge | `primary` |
| RETURNED / FAILED | Red tint bg / danger text | `danger` |
| Arrears severity | 1–7 days `warning` · 8–30 days `danger` · >30 days `danger` + solid fill | escalating ramp |
| Offline / queued | Amber dot + "Inasubiri mtandao" label | `warning` |

## 3. Typography

| Token | Value | Notes |
|---|---|---|
| Font family | **Inter** (Latin + full Swahili diacritics), system-ui fallback | Free, excellent legibility at POS distances; confirm against core BiasharaPOS font and replace here if the platform already standardizes on another |
| `type.display` | 28/36, 700 | Screen titles (back office) |
| `type.heading` | 20/28, 600 | Card titles, dialog headers |
| `type.body` | 16/24, 400 | Default |
| `type.label` | 13/16, 500, +0.02em | Field labels, badges (all-caps sparingly) |
| `type.numeric` | 16–32, 600, **tabular-nums** | ALL money and serials use tabular figures — amounts must align in columns |
| POS touch sizing | Body ≥16px; primary buttons ≥48px tall | Counter use on mid-range tablets |

Money format: `TZS 1,250,000` — integer, comma-grouped, currency prefix, never decimals. Serials render in `type.numeric` with a monospace-feel (tabular) and a copy affordance.

## 4. Spacing, shape, elevation

- **Spacing scale:** 4 / 8 / 12 / 16 / 24 / 32 / 48 (px). Cards pad 16; page gutters 24.
- **Radius:** `radius.sm` 6 (inputs, badges) · `radius.md` 10 (cards, buttons) · `radius.lg` 16 (sheets/dialogs). Matches the rounded-but-not-bubbly inherited style.
- **Elevation:** two levels only — flat (border, no shadow) and raised (dialogs/sheets: `0 4px 16px rgba(31,41,55,0.12)`). Nothing else; the brand is flat.
- **Iconography:** outline icons, 1.5px stroke, 20/24px grid (Lucide set — open source, consistent with flat style).

## 5. Core components (implemented in `packages/ui`)

1. **Button** — primary (green solid), secondary (outline), danger, ghost; loading state; ≥48px POS variant.
2. **Money display** — the tabular-nums TZS formatter; positive/negative/muted variants. Used everywhere money appears — no ad-hoc formatting.
3. **StatusBadge** — the §2.3 vocabulary as one component (`<StatusBadge kind="unit|arrears|sync|delivery" value=... />`).
4. **SerialChip** — serial number pill with copy + lookup-on-tap; scan-input field variant with barcode focus behavior.
5. **Card / ListRow** — back-office card grid and dense list rows (stock, arrears, deliveries).
6. **ScheduleTable** — installment schedule renderer (due date, amount, status, paid-with) shared by POS, back office, and the printable statement.
7. **PaymentMethodPicker** — cash / M-Pesa / Mixx by Yas / Airtel Money tiles with provider marks used per each provider's brand rules.
8. **OfflineBar** — global connectivity/sync state strip (hidden when online-and-synced; amber when queued; red when conflicts).
9. **Dialog / Sheet** — confirmation patterns; destructive actions always red + verb-specific ("Futa makubaliano", not "OK").
10. **Receipt & Statement print styles** — 80mm thermal CSS + A4 PDF: merchant header, items, VFD number + QR (mandatory, bottom, never cropped), Swahili labels with English secondary.

## 6. Sub-brand identity: logo & lockups

The Appliances & Electronics platform keeps the family wordmark and adds a **vertical mark**: a rounded-square icon in Biashara Green containing a white **power symbol** (the universal electronics glyph) whose stem is a subtle lightning bolt — reading "appliances & electronics" at a glance while staying flat and minimal.

**Files (repo `brand/`):**
- `logo-appliances-lockup.svg` — full horizontal lockup: icon + "Biashara**POS**" wordmark + descriptor "APPLIANCES & ELECTRONICS" in Steel Blue.
- `logo-appliances-icon.svg` — icon only (app icon, favicon, receipt header stamp).

**Usage rules:**
- Descriptor always set in `color.accent` Steel Blue, letter-spaced caps — this is the sub-brand's one differentiating flourish; do not recolor.
- Icon minimum size 24px; lockup minimum width 140px; clear space = height of the icon's power-symbol on all sides.
- On dark surfaces: icon stays green with white glyph; wordmark switches to white; descriptor switches to `#7FB6D9` (accent 60% tint).
- Never: gradients, shadows, outlines, stretching, or placing the green icon on clashing color fields (use white or `color.background`).

## 7. Accessibility & localization

- Contrast: all text ≥ 4.5:1 (Biashara Green on white passes for large text/badges only — body text on green uses white; green text only ≥ 18px or bold 14px+).
- Full keyboard operability in back office; POS optimized for touch + hardware barcode scanner (keyboard-wedge) input.
- Swahili is a first-class locale, not a translation afterthought: labels designed for Swahili length first (typically longer than English); date format `dd/MM/yyyy`; all templates (SMS, receipts, statements) authored in both languages.
- Color is never the only signal — every status badge pairs color with a label/icon.

## 8. Governance

- Tokens live in `packages/ui/tokens.ts` and are the only source of color/type/spacing values — no hex literals in feature code (lint rule).
- Changes to inherited foundation values (§1–2 core palette) require sign-off from the core BiasharaPOS brand owner; sub-brand tokens (accent, domain statuses) are owned by this product.
- New components enter `packages/ui` only with both locales and both surfaces (POS + back office) considered.
