import { color, font, fontWeight } from '../tokens.js';

/** Format integer TZS: `TZS 1,250,000` — never decimals (ARCHITECTURE.md money rule). */
export function formatTzs(amount: number): string {
  if (!Number.isInteger(amount)) throw new Error('Money must be integer TZS');
  return `TZS ${amount.toLocaleString('en-US')}`;
}

export interface MoneyDisplayProps {
  amountTzs: number;
  variant?: 'default' | 'positive' | 'negative' | 'muted';
  size?: number;
}

const variantColor = {
  default: color.ink,
  positive: color.greenD,
  negative: color.red,
  muted: color.ink3,
} as const;

/** THE way money renders — tabular numerals so amounts align in columns. */
export function MoneyDisplay({ amountTzs, variant = 'default', size }: MoneyDisplayProps) {
  return (
    <span
      style={{
        fontFamily: font.sans,
        fontVariantNumeric: 'tabular-nums',
        fontWeight: fontWeight.semibold,
        color: variantColor[variant],
        ...(size ? { fontSize: size } : {}),
      }}
    >
      {formatTzs(amountTzs)}
    </span>
  );
}
