# BiasharaPOS — Design System

**Smart Business. Seamless Sales.**

BiasharaPOS is a point-of-sale and inventory platform **built for Tanzania**.
It gives small and medium businesses **real-time profit on every sale** (after
cost of goods, VAT and expenses — not just revenue), accepts **mobile money and
cards** (M-Pesa, Mixx by Yas, Airtel Money, Visa, Mastercard, cash), prints
**TRA-compliant fiscal (VFD) receipts**, generates monthly VAT reports for the
**Tanzania Revenue Authority**, and runs **fully offline** — sales queue locally
and sync when the network returns. It is **bilingual (English + Swahili)** and
ships tailored flows for five verticals: **clothing, retail, restaurant,
pharmacy and hospital/clinic**.

This project is the design system distilled from the real product surfaces.

---

## Products represented

| Surface | What it is | Source |
|---|---|---|
| **BiasharaPOS app** | The web app that runs the till — login, profit dashboard, make-a-sale, products, inventory, expenses, TRA reports, barcodes, restaurant & pharmacy modules. Single-page app, emoji-driven tab nav, TZS currency. | `amashashi/biashara-pos` → `public/index.html` |
| **Marketing website** | The biashara-pos.com landing site — vision hero, industry switcher, industries grid, features, pricing, FAQ, footer. Astro 4 static, EN/SW toggle, custom line-SVG icons. | `amashashi/biashara-pos-website` |
| **WhatsApp/social agent** | Backend conversational agent (no first-party UI). Context only. | `amashashi/biashara-social-agent`, `biashara-pos/whatsapp-agent` |

### Sources (private — for the reader who has access)
- **POS app:** https://github.com/amashashi/biashara-pos — the source of truth for the app UI (`public/index.html`), brand palette and Tailwind config.
- **Website:** https://github.com/amashashi/biashara-pos-website — `src/styles/landing.css` (the most complete token + component definition), `src/data/verticals.ts` (per-vertical product copy), `src/assets/verticals/*` (industry photos), `IMPLEMENTATION.md`.
- **Social agent:** https://github.com/amashashi/biashara-social-agent

Explore these repositories to design with higher fidelity — the landing CSS and
the app's `index.html` are the canonical references for any new BiasharaPOS work.

> **Two palettes, reconciled.** The app ships slightly flatter working values
> (`--blue #1A56A0`, `--green #1D9E75`); the website samples richer values
> straight from the logo (`--blue #0f5da4`, `--green #239b46`, `--gold #e7a52c`).
> This system adopts the **logo-sampled website values as canonical** because
> they are the most intentional and best documented. Both read as the same brand.

---

## CONTENT FUNDAMENTALS

**Voice — plain, direct, owner-to-owner.** Copy speaks to a shopkeeper in second
person ("**See your real profit on every sale**", "**Know exactly what you
made**"). It is confident and concrete, never corporate. Benefit first, feature
second.

**Bilingual by design.** English is primary; Swahili runs alongside it
everywhere (`data-en` / `data-sw`). Swahili is woven in naturally — product names
("Sukari 1kg", "Maziwa 1L", "Mchele 5kg", "Nyama choma"), section labels
("Sekta", "Bei", "Vipengele"), and inline italic phrases. Never machine-stiff;
it reads like a Dar es Salaam trader wrote it.

**Casing.** Sentence case for headings and body. UPPERCASE only for small tracked
eyebrows ("REAL-TIME PROFIT"), table headers, and the tagline ("SMART BUSINESS ·
SEAMLESS SALES"). The wordmark is always **Biashara**POS (blue + gold), never all-caps.

**Money & locale.** Currency is always **TZS** written as `TZS 84,200` (prefix,
thin comma groups, no decimals for whole shillings). Profit is shown with a sign
(`+TZS 4,200`). Phone numbers are `+255 7xx xxx xxx`. Tax is **VAT 18%**, payable
to the **TRA**; fiscal receipts are **VFD**.

**Specificity over hype.** Claims are backed by concrete mechanics — "after cost
of goods, VAT and expenses", "queue locally and sync", "FEFO picks the oldest
batch automatically". Real Tanzanian context everywhere (M-Pesa, Mixx by Yas,
NHIF, Kariakoo). No fake testimonials or invented ratings.

**Emoji** appear **inside the product** as functional nav/section markers
(📊 Dashboard, 🛒 Make a Sale, 🧾 TRA Report). The **marketing site does not use
emoji** — it uses line-SVG icons. Match that split: emoji in app chrome only.

**Examples**
- Eyebrow → headline: *"REAL-TIME PROFIT" → "See your real profit on every single sale"*
- CTA: *"Start free — no card"*, *"See a live demo"*, *"Chat on WhatsApp"*
- Reassurance ticks: *"Works offline · TRA-compliant · M-Pesa & Mixx by Yas"*

---

## VISUAL FOUNDATIONS

**Palette.** Three brand hues sampled from the logo: **azure blue** `#0f5da4`
(dominant — the "Biashara" wordmark, headers, links, the app top bar), **emerald
green** `#239b46` (action & money — primary CTAs, profit, success, the "Charge"
button), **warm gold** `#e7a52c` (accent — the logo's upward arrow, "Most
popular", low-stock flags). A **bright cyan** `#2faee4` only ever appears *inside*
brand gradients. Neutrals are deliberately **cool** (ink `#13202c`, body
`#45525e`, muted `#7a8590`) so they sit calmly beside the blue; page background is
a faint blue-white `#f6f8fb`, sections alternate white and a `#eef4f6` tint wash.

**Type.** A single family — **Plus Jakarta Sans** — does everything. Headings are
**heavy (800) and tightly tracked** (`-0.022em`; display drops to `-0.03em`);
body is regular at a relaxed `1.5–1.6` line-height. Big money figures are 800 and
tight. Mono (`SF Mono`/system) is reserved for SKUs, receipt numbers and phone
numbers. No second typeface.

**Backgrounds.** Mostly flat surfaces. Gradients are used **sparingly and only in
brand directions**: a soft radial blue+green glow behind heroes; the deep
`blue→green` band on the final CTA and the app login; an emerald `green→green-dd`
on profit cards. Industry photography is full-color, warm, real Tanzanian
interiors (no filters, no duotone). Decorative placeholders use a faint diagonal
green hatch. No stock-photo gloss, no purple SaaS gradients.

**Corner radius.** A clear ladder: `6px` chips/badges, `10px` buttons & inputs &
product tiles, `16px` cards, `26px` feature panels / dashboards / modals, full
pills for tabs, toggles and status badges.

**Borders.** Hairline `1px #e4e8ee` on cards; `1.5px #d4dae2` on inputs and
product tiles; active tab carries a `2px` blue underline. Borders do the
separating work — the system leans on **borders + soft shadow**, not heavy fills.

**Shadows (cool, low-spread).** Three steps: `sh-sm` (barely-there, resting
chips), `sh-md` (hover lift on cards), `sh-lg` (dashboards, modals, login).
Lifts pick up a **green brand tint** in the large shadow; the green CTA carries
its own colored glow. No hard or black drop-shadows.

**Hover.** Buttons and cards **lift 2px** (`translateY(-2px)`) and deepen their
shadow; primary green darkens to `green-d`; ghost buttons darken their border;
product tiles raise 1px with a blue-tinted shadow and blue border; links shift to
green. **Press** returns to `translateY(0)`.

**Motion.** Quick and functional — `.15s–.2s` ease (`cubic-bezier(.4,0,.2,1)`).
Reveal-on-scroll fades content up `22px` over `.6s` (with a reduced-motion and
failsafe override to the visible end-state). The only loop is a gentle 1.6s
"live" status blink. No bounces, no parallax, no long decorative animation.

**Transparency & blur.** The sticky nav is a translucent page-tint with
`backdrop-filter: blur(14px)`. On dark/brand bands, secondary buttons use
`rgba(255,255,255,.14)` glass fills. Otherwise surfaces are opaque.

**Cards.** White, hairline border, `16px` radius, `~18px` padding, optional small
uppercase eyebrow title; lift on hover only when clickable. Dashboard KPI tiles
are the same recipe at `10px` radius with a tone-colored heavy number.

**Layout.** Centered max-widths (`1180px` marketing, `1100px` app), `28px` gutter.
Sticky top bar (app) / nav (web). Section vertical rhythm `~90px`. Generous
whitespace; content is calm and scannable, never dense for its own sake.

---

## ICONOGRAPHY

BiasharaPOS now has **its own bespoke icon set** — the `Icon` component
(`components/icons/Icon.jsx`) — drawn to match Plus Jakarta Sans: a `24×24`
grid, even `~1.9px` stroke, round caps/joins and gently rounded corners,
stroke-only so it inherits `currentColor`. Use it as the **canonical icon
source** for product UI: `<Icon name="dashboard" />`, plus `bell`, `sale`,
`products`, `expenses`, `report`, `analytics`, `barcode`, `users`, `shifts`,
`search`, `settings`, `logout`, `checkCircle`, `sparkle`, `store`, etc. The POS
app kit uses it for the tab nav and the top-bar notification bell.

Historically the product mixed two registers — useful when reading the source repos:

1. **In the app (chrome & navigation): emoji.** The shipped product labels every
   tab with a leading emoji — 📊 Dashboard, 🛒 Make a Sale, 📦 Products, 💸 Expenses,
   🧾 TRA Report, etc. `Tabs` still accepts any node as `icon`, so emoji remain
   valid — but prefer the bespoke `Icon` set for a more crafted feel (as the kit
   now does).

2. **On the website (features & verticals): custom inline line-SVGs.** Stroke-only,
   `24×24`, `~2px` stroke, rounded caps/joins, no fill (see `verticals.ts`). Sit in
   rounded tinted tiles (`46px`, green/blue/gold wash). The `Icon` set speaks the
   same language, so it slots into marketing layouts cleanly too.

**There is no icon font or SVG sprite** in the original codebase. If you need a
glyph beyond the `Icon` set, draw it in the same style (24-grid, ~1.9px stroke,
round caps) and add it to `Icon.jsx`; only fall back to **[Lucide](https://lucide.dev)**
from CDN for one-offs, and flag the substitution.

**Logo & brand marks** (in `assets/`): `logo-full.png` (primary wordmark — blue
"Biashara", gold "POS", green cart + chart + gold arrow, tagline rule),
`logo-badge.png` (the rounded square app badge), `app-icon.png` (192px PWA icon).
Never recolor, stretch or rebuild the wordmark; reverse it to white only on ink
or brand bands.

**Currency, not icons, for money.** Money is typeset (`TZS …`), never iconified.
Payment methods are shown as text wordmarks in bordered chips, not logos.

---

## What's in here (index / manifest)

```
styles.css                  ← global entry point (consumers link this). @import-only.
tokens/
  fonts.css                 ← Plus Jakarta Sans (self-hosted variable fonts via @font-face)
  colors.css                ← brand hues, tints, status, neutrals, semantic aliases, gradients
  typography.css            ← family, weights, scale, line-height, tracking
  spacing.css               ← spacing scale, radius, borders, shadow, motion, layout
guidelines/                 ← foundation specimen cards (Design System tab)
  colors-*.card.html · type-*.card.html · spacing-*.card.html · brand-logo.card.html
components/                 ← reusable React primitives (compiled into _ds_bundle.js)
  core/   → Button, Badge, Card
  forms/  → Input, Switch
  app/    → MetricCard, ProductTile, Tabs
  icons/  → Icon (bespoke brand icon set)
ui_kits/
  pos-app/                  ← interactive recreation of the POS app (Login → Dashboard → Sale)
  website/                  ← faithful recreation of the marketing landing page
assets/                     ← logo-full, logo-badge, app-icon, icon.svg, fonts/, verticals/*.jpg
SKILL.md                    ← Agent-Skills entry point for downloading & reuse
```

**Components** (`window.BiasharaPOSDesignSystem_…`): `Button`, `Badge`, `Card`,
`Input`, `Switch`, `MetricCard`, `ProductTile`, `Tabs`, `Icon`. Each has a `.d.ts`
props contract and a `.prompt.md` usage note. `Button`, `MetricCard` and `Icon`
are registered **Starting Points**.

**UI kits:** `ui_kits/pos-app/` (email + social sign-in with two-step
verification, a first-login welcome splash, profit dashboard, make-a-sale with
live cart, VAT toggle, payment selection and TRA receipt — fully **tweakable**:
brand colors, corners, sign-in methods, business name, VAT rate) and
`ui_kits/website/` (vision hero, industry switcher, industries grid, features,
pricing, CTA, footer, EN/SW toggle).

---

## Using this system

- **Throwaway visuals / slides / mocks:** copy assets out of `assets/`, link
  `styles.css` for tokens, and build static HTML. Lift the section styles from
  `ui_kits/website/landing.css` for marketing-flavored layouts.
- **Product / app work:** compose the components from the bundle; follow the
  app's emoji-tab IA and the cool-neutral, border-and-soft-shadow visual language.
- Default to TZS, Tanzanian context, and EN(/SW) copy. Green commits, blue
  navigates, gold accents.
