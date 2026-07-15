/**
 * Design tokens — SINGLE SOURCE for color/type/spacing values (DESIGN_SYSTEM.md §8).
 * Transcribed from the canonical design handoff (design-handoff/_ds/&lt;bundle&gt;/tokens/ *.css files).
 * No hex or spacing literals anywhere else in feature code (lint-enforced).
 */

// ---- Core palette (handoff tokens/colors.css) ----
export const color = {
  // Brand: Azure Blue — dominant ("Biashara")
  blue: '#0F5DA4',
  blueD: '#0C4A85',
  blueDD: '#0A3A6B',
  blue100: '#CFE1F4',
  blue50: '#E8F1FA',
  // Brand: Emerald Green — CTA / money / success
  green: '#239B46',
  greenD: '#1B7C34',
  greenDD: '#145F28',
  green100: '#CCE9D4',
  green50: '#E8F6EC',
  // Brand: Cyan (gradient companion) & Gold (accent)
  cyan: '#2FAEE4',
  gold: '#E7A52C',
  goldL: '#F4B53E',
  gold50: '#FDF3E1',
  // Semantic status
  amber: '#BA7517',
  red: '#D85A30',
  red50: '#FEF2F2',
  // Neutrals (cool)
  ink: '#13202C',
  ink2: '#45525E',
  ink3: '#7A8590',
  bg: '#F6F8FB',
  surface: '#FFFFFF',
  tint: '#EEF4F6',
  line: '#E4E8EE',
  line2: '#D4DAE2',
  // Sub-brand: Appliances & Electronics (DESIGN_SYSTEM.md §2.2)
  steel: '#1D6A96',
  steelTint: '#E8F1F7',
  white: '#FFFFFF',
} as const;

export const brand = {
  primary: color.blue,
  secondary: color.green,
  accent: color.gold,
  subBrand: color.steel,
  textOnBrand: color.white,
} as const;

// ---- Typography (handoff tokens/typography.css) ----
export const font = {
  sans: `"Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", sans-serif`,
  mono: `ui-monospace, "SF Mono", Menlo, Consolas, monospace`,
} as const;

export const fontWeight = { light: 300, regular: 400, medium: 500, semibold: 600, bold: 700, heavy: 800 } as const;

export const fontSize = {
  display: 76,
  h1: 44,
  h2: 32,
  h3: 20,
  lead: 19,
  body: 15,
  bodyLg: 16,
  sm: 13,
  xs: 11.5,
} as const;

// ---- Spacing / radius / borders / shadows / motion (handoff tokens/spacing.css) ----
export const space = { s0: 0, s1: 4, s2: 8, s3: 12, s4: 16, s5: 20, s6: 24, s8: 32, s10: 40, s12: 48, s16: 64, s20: 80, s24: 96 } as const;

export const radius = { xs: 6, sm: 10, md: 16, lg: 26, pill: 999 } as const;

export const border = { hair: 1, default: 1.5, strong: 2 } as const;

export const shadow = {
  sm: '0 1px 2px rgba(18,32,25,.06), 0 1px 3px rgba(18,32,25,.05)',
  md: '0 10px 24px -12px rgba(18,32,25,.20), 0 2px 6px rgba(18,32,25,.05)',
  lg: '0 30px 70px -28px rgba(11,122,94,.40), 0 8px 24px -12px rgba(18,32,25,.14)',
  cta: '0 8px 20px -8px rgba(35,155,70,.6)',
  modal: '0 20px 60px rgba(0,0,0,.2)',
} as const;

export const motion = {
  ease: 'cubic-bezier(.4, 0, .2, 1)',
  durFast: '.15s',
  dur: '.2s',
  durSlow: '.45s',
} as const;

export const layout = { wrap: 1180, wrapApp: 1100, topbarH: 52, posTouchTarget: 48 } as const;

// ---- Domain status vocabulary (DESIGN_SYSTEM.md §2.3) ----
export type UnitStatusToken = 'IN_STOCK' | 'RESERVED' | 'SOLD' | 'DELIVERED' | 'RETURNED' | 'FAILED';

export const unitStatusStyle: Record<UnitStatusToken, { bg: string; fg: string; solid?: boolean }> = {
  IN_STOCK: { bg: color.green50, fg: color.greenD },
  RESERVED: { bg: color.steelTint, fg: color.steel },
  SOLD: { bg: color.tint, fg: color.ink2 },
  DELIVERED: { bg: color.green, fg: color.white, solid: true },
  RETURNED: { bg: color.red50, fg: color.red },
  FAILED: { bg: color.red50, fg: color.red },
};

/** Arrears severity ramp: 1–7 days amber · 8–30 red · >30 solid red */
export function arrearsStyle(daysOverdue: number): { bg: string; fg: string } {
  if (daysOverdue > 30) return { bg: color.red, fg: color.white };
  if (daysOverdue >= 8) return { bg: color.red50, fg: color.red };
  return { bg: color.gold50, fg: color.amber };
}
