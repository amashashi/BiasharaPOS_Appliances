# Handoff: BiasharaPOS — Appliances & Electronics Design System

## Overview
This package documents the **Appliances & Electronics sub-brand** of the BiasharaPOS
point-of-sale platform. It defines the sub-brand's visual foundation (inherited from
the BiasharaPOS core brand), its own extensions (Steel Blue accent, the serialized-unit
status vocabulary, sub-brand logo), and the component standards to be implemented as the
shared UI package (`packages/ui`).

The signature of this platform is a **fixed status-badge vocabulary** used identically in
POS, back office, and reports so counter staff learn one language. It is bilingual
(Swahili-first, English secondary).

## About the Design Files
The file in this bundle (`Appliances Design System.dc.html`) is a **design reference
created in HTML** — a living style guide showing the intended look and behavior. It is
**not production code to copy directly**. The task is to recreate these tokens and
components in the target codebase's environment (the BiasharaPOS monorepo — React +
`packages/ui`, TypeScript tokens in `packages/ui/tokens.ts`) using its established
patterns. Per the design system's governance rule: **no hex literals in feature code** —
everything routes through tokens.

The HTML prototype composes the existing BiasharaPOS core component bundle (`Button`,
`Badge`, `Icon`, etc.); reuse those core primitives and add only the sub-brand-specific
components listed below.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, radii, and status treatments
are exact and should be reproduced precisely. Copy is final (bilingual).

---

## Screens / Views
This is a single-page reference document (not an app flow). It is organized into eight
sections plus a hero. Each section is a labeled block; recreate them as documentation
pages OR harvest them into the token/component library.

### Hero
- Sub-brand lockup (icon + `BiasharaPOS` wordmark + descriptor), page title, intro, status chips.

### 01 · Brand foundation
- Three cards: family identity, wordmark, voice. Tagline "Smart Business · Seamless Sales".

### 02 · Color tokens (the core deliverable)
- **Core palette** table, **semantic** colors, the **accent** (Steel Blue) showcase, and
  the **2.3 domain status vocabulary** (unit states, arrears ramp, connectivity) — the
  signature UI.

### 03 · Typography
- Type scale specimens; money (tabular TZS) and serial (tabular, mono-feel) treatments.

### 04 · Spacing / shape / elevation
- 4px spacing scale, radius ladder (6/10/16), two-level elevation (flat / raised).

### 05 · Components
- Button (live core component), SerialChip (+ scan-input variant), StatusBadge in ListRow,
  ScheduleTable (installments), PaymentMethodPicker, Dialog (destructive), OfflineBar.

### 06 · Logo & lockups
- Sub-brand mark on light and dark, sizes, usage rules, "never" rules.

### 07 · Accessibility & localization  ·  08 · Governance
- Contrast, bilingual/locale rules; token ownership and change control.

---

## Interactions & Behavior
- **SerialChip copy**: tapping the copy button writes the serial to the clipboard and shows
  an "Imenakiliwa" (Copied) confirmation for ~1.6s. Serials also support lookup-on-tap.
- **Scan-input variant**: focused state shows a Steel Blue border + focus ring; accepts
  hardware barcode-scanner (keyboard-wedge) input.
- **OfflineBar / queued status**: amber dot blinks on a 1.6s loop (`bpBlink`,
  `cubic-bezier(.4,0,.2,1)`), label "Inasubiri mtandao". Hidden when online-and-synced;
  amber when queued; red when conflicts.
- **Motion**: quick and functional, `.15s–.2s` ease. Hover lift `translateY(-2px)` on
  buttons/cards; the only loop is the "live/queued" blink. No bounces or parallax.
- **Dialog**: destructive actions are always red + verb-specific ("Futa makubaliano", never "OK").

## State Management
- `copied` (boolean) — SerialChip copy confirmation, auto-resets after 1600ms.
- Connectivity state drives OfflineBar (online-synced / queued / conflict) and the
  offline/queued badge.
- `SerializedUnit.status` enum drives StatusBadge: `IN_STOCK | RESERVED | SOLD | DELIVERED
  | RETURNED | FAILED`.
- Arrears severity derived from days-overdue: `1–7 → warning`, `8–30 → danger`,
  `>30 → danger + solid fill`.

---

## Design Tokens

### Colors — core palette
| Token | Hex | Usage |
|---|---|---|
| color.primary | `#239B46` | Primary actions, active states, brand moments (Biashara Green, inherited) |
| color.primary.dark | `#1B7A37` | Hover/pressed on primary, receipt headers |
| color.primary.tint | `#E9F6EE` | Selected rows, subtle highlights, success bg |
| color.accent | `#1D6A96` | **Steel Blue** — sub-brand accent: vertical identity, serial/tech UI, chips |
| color.accent.tint | `#E8F1F7` | Accent backgrounds |
| color.accent.60 (dark) | `#7FB6D9` | Descriptor on dark surfaces |
| color.ink | `#1F2937` | Primary text |
| color.ink.muted | `#6B7280` | Secondary text, labels |
| color.surface | `#FFFFFF` | Cards, sheets |
| color.background | `#F6F8F7` | App canvas |
| color.border | `#E5E7EB` | Dividers, input borders |

### Colors — semantic
| Token | Hex | Usage |
|---|---|---|
| color.success | `#239B46` | Payments confirmed, delivery completed |
| color.warning | `#D97706` | Due soon, pending sync, aging stock |
| color.danger | `#DC2626` | Overdue/arrears, failed fiscalization, conflicts |
| color.info | `#1D6A96` | Informational banners (reuses accent) |

### Domain status colors (badge bg / text)
| State | Background | Text | Label (SW · EN) |
|---|---|---|---|
| IN_STOCK | `#E9F6EE` | `#1B7A37` | STOKINI · In stock |
| RESERVED | `#E8F1F7` | `#1D6A96` | IMEHIFADHIWA · Reserved |
| SOLD | `#F3F4F6` | `#1F2937` | IMEUZWA · Sold |
| DELIVERED | `#239B46` (solid) | `#FFFFFF` | IMEFIKISHWA · Delivered (check icon) |
| RETURNED / FAILED | `#FEF2F2` | `#DC2626` | IMERUDISHWA · Returned |
| Arrears 1–7d | `#FEF6EC` | `#D97706` | Siku N · days late |
| Arrears 8–30d | `#FEF2F2` | `#DC2626` | Siku N |
| Arrears >30d | `#DC2626` (solid) | `#FFFFFF` | Siku N · Overdue |
| Offline / queued | `#FEF6EC` | `#D97706` | Inasubiri mtandao · Queued (blinking dot) |

### Typography
- **Family**: Plus Jakarta Sans (core BiasharaPOS family; system-ui fallback). The
  original sub-brand draft named Inter — the core family standard takes precedence.
  Mono (`ui-monospace, "SF Mono", Menlo`) for serials, SKUs, receipt/phone numbers.
- type.display — 28/36, 700 (screen titles)
- type.heading — 20/28, 600 (card titles, dialog headers)
- type.body — 16/24, 400 (default)
- type.label — 13/16, 500, +0.02em (field labels, badges; all-caps sparingly)
- type.numeric — 16–32, 600, **tabular-nums** (ALL money and serials — must column-align)
- POS touch sizing — body ≥16px; primary buttons ≥48px tall
- **Money format**: `TZS 1,250,000` — integer, comma-grouped, currency prefix, never decimals.

### Spacing (4px base)
`4 / 8 / 12 / 16 / 24 / 32 / 48` px. Cards pad 16; page gutters 24; section rhythm ~56px.

### Radius
`radius.sm` 6 (inputs, badges) · `radius.md` 10 (cards, buttons) · `radius.lg` 16 (sheets/dialogs) · pill 999.

### Elevation (two levels only)
- flat: `1px solid #E5E7EB`, no shadow
- raised (dialogs/sheets): `0 4px 16px rgba(31,41,55,0.12)`

### Iconography
Outline icons, 1.5px stroke, 20/24px grid. Reuse the core BiasharaPOS `Icon` set; draw new
glyphs in the same style (24-grid, ~1.9px stroke, round caps) if needed.

---

## Components to implement in `packages/ui`
1. **Button** — primary (green solid), secondary (blue), danger, ghost; loading; ≥48px POS variant. *(exists in core)*
2. **Money** — tabular-nums TZS formatter; positive (green) / negative (red) / muted variants. No ad-hoc formatting anywhere.
3. **StatusBadge** — `<StatusBadge kind="unit|arrears|sync|delivery" value=… />` implementing the table above; color + icon + bilingual label (never color alone).
4. **SerialChip** — serial pill with copy + lookup-on-tap; scan-input field variant with barcode focus behavior.
5. **Card / ListRow** — card grid + dense list rows (stock, arrears, deliveries).
6. **ScheduleTable** — installment schedule (due date, amount, status, paid-with); shared by POS, back office, printable statement.
7. **PaymentMethodPicker** — Cash (Taslimu) / M-Pesa / Mixx by Yas / Airtel Money tiles; text wordmarks in bordered chips (not logos), per each provider's brand rules.
8. **OfflineBar** — global connectivity strip; hidden when synced, amber when queued, red when conflicts.
9. **Dialog / Sheet** — confirmation patterns; destructive = red + verb-specific label.
10. **Receipt & Statement print styles** — 80mm thermal + A4 PDF; merchant header, items,
    VFD number + QR (mandatory, bottom, never cropped); Swahili labels with English secondary.

## Sub-brand logo
A rounded-square icon in Biashara Green `#239B46` containing a white **power symbol** whose
stem is a subtle lightning bolt. The provided SVG (see the HTML `<svg viewBox="0 0 48 48">`)
is production-ready — export as `logo-appliances-icon.svg`, and the full lockup
(icon + wordmark + descriptor) as `logo-appliances-lockup.svg`.
- Descriptor "APPLIANCES & ELECTRONICS" always Steel Blue `#1D6A96`, letter-spaced caps (0.16em).
- On dark: wordmark → white, descriptor → `#7FB6D9`; icon stays green with white glyph.
- Icon min 24px; lockup min width 140px. Never: gradients, shadows, outlines, stretching, or the green icon on clashing fields.

## Accessibility & localization
- All text ≥ 4.5:1 contrast; body-on-green uses white (green text only ≥18px or bold 14px+).
- Swahili is first-class: size labels for Swahili length first; date `dd/MM/yyyy`; SMS/receipts/statements authored in both languages.
- Full keyboard operability in back office; POS optimized for touch + hardware barcode scanner.
- Color is never the only signal — every status badge pairs color with a label/icon.

## Governance
- Tokens live in `packages/ui/tokens.ts` — the only source of color/type/spacing values (lint rule: no hex literals in feature code).
- Inherited core-palette changes require core BiasharaPOS brand-owner sign-off; sub-brand tokens (accent, domain statuses) are owned by this product.
- New components ship only with both locales and both surfaces (POS + back office) considered.

## Assets
- Sub-brand logo SVG — provided inline in the HTML (`viewBox="0 0 48 48"`), ready to extract.
- Core BiasharaPOS assets (`logo-full`, `logo-badge`, app icon, `Icon` set) — use the existing brand system in the codebase.
- No third-party images used.

## Files
- `Appliances Design System.dc.html` — the full living style guide (design reference).
