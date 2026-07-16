import { TAX_CODES, type TaxCode, type Tzs } from '@biashara/shared';

export interface FieldError {
  field: string;
  message: string;
}

export interface ProductInput {
  sku: string | null;
  brand: string;
  model: string;
  category: string;
  taxCode: TaxCode;
  priceTzs: Tzs;
  costTzs: Tzs | null;
}

const LIMITS = { sku: 64, brand: 120, model: 120, category: 80 } as const;
/** Money columns are int4 — cap keeps inserts from overflowing Postgres. */
const MAX_TZS = 2_000_000_000;

const asTrimmed = (v: unknown): string | null => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
};

/** Accepts number or plain-digit string; TZS is integer-only, no separators. */
const asTzs = (v: unknown): number | null => {
  if (typeof v === 'number') return Number.isSafeInteger(v) ? v : null;
  if (typeof v === 'string' && /^\d+$/.test(v.trim())) return Number(v.trim());
  return null;
};

/**
 * Validate a product payload. One rule source for CRUD bodies and CSV rows
 * so both report identical field errors. With `partial`, absent fields are
 * left out of `value` instead of failing (PATCH semantics).
 */
export function validateProductInput(
  raw: Record<string, unknown>,
  opts: { partial?: boolean } = {},
): { value: Partial<ProductInput>; errors: FieldError[] } {
  const errors: FieldError[] = [];
  const value: Partial<ProductInput> = {};
  const present = (f: string): boolean => !opts.partial || raw[f] !== undefined;

  for (const field of ['brand', 'model', 'category'] as const) {
    if (!present(field)) continue;
    const s = asTrimmed(raw[field]);
    if (!s) errors.push({ field, message: `${field} is required` });
    else if (s.length > LIMITS[field]) {
      errors.push({ field, message: `${field} must be at most ${LIMITS[field]} characters` });
    } else value[field] = s;
  }

  if (present('sku')) {
    const s = asTrimmed(raw.sku);
    if (s && s.length > LIMITS.sku) {
      errors.push({ field: 'sku', message: `sku must be at most ${LIMITS.sku} characters` });
    } else value.sku = s;
  }

  if (present('taxCode')) {
    const s = asTrimmed(raw.taxCode)?.toUpperCase() ?? 'A'; // blank → standard rate
    if (!(TAX_CODES as readonly string[]).includes(s)) {
      errors.push({ field: 'taxCode', message: `taxCode must be one of ${TAX_CODES.join(', ')}` });
    } else value.taxCode = s as TaxCode;
  } else if (!opts.partial) {
    value.taxCode = 'A';
  }

  if (present('priceTzs')) {
    const n = asTzs(raw.priceTzs);
    if (n === null || n <= 0 || n > MAX_TZS) {
      errors.push({
        field: 'priceTzs',
        message: 'priceTzs must be a positive whole number of TZS (no decimals or separators)',
      });
    } else value.priceTzs = n;
  }

  if (present('costTzs')) {
    if (asTrimmed(raw.costTzs) === null) {
      value.costTzs = null;
    } else {
      const n = asTzs(raw.costTzs);
      if (n === null || n < 0 || n > MAX_TZS) {
        errors.push({
          field: 'costTzs',
          message: 'costTzs must be a whole number of TZS (no decimals or separators)',
        });
      } else value.costTzs = n;
    }
  }

  return { value, errors };
}
