import type { CSSProperties, ReactNode, ButtonHTMLAttributes } from 'react';
import { border, brand, color, fontSize, fontWeight, layout, motion, radius, shadow, space, font } from '../tokens.js';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** POS counter sizing: ≥48px tall touch target */
  pos?: boolean;
  loading?: boolean;
  children: ReactNode;
}

const variants: Record<ButtonVariant, CSSProperties> = {
  primary: { background: brand.secondary, color: brand.textOnBrand, border: 'none', boxShadow: shadow.cta },
  secondary: { background: color.surface, color: brand.primary, border: `${border.default}px solid ${color.line2}` },
  danger: { background: color.red, color: brand.textOnBrand, border: 'none' },
  ghost: { background: 'transparent', color: color.ink2, border: 'none' },
};

export function Button({ variant = 'primary', pos = false, loading = false, children, disabled, style, ...rest }: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      style={{
        fontFamily: font.sans,
        fontSize: fontSize.bodyLg,
        fontWeight: fontWeight.semibold,
        padding: `${space.s2}px ${space.s4}px`,
        minHeight: pos ? layout.posTouchTarget : 36,
        borderRadius: radius.sm,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.6 : 1,
        transition: `all ${motion.dur} ${motion.ease}`,
        ...variants[variant],
        ...style,
      }}
      {...rest}
    >
      {loading ? '…' : children}
    </button>
  );
}
