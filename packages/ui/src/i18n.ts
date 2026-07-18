/** Bilingual strings for UI components — Swahili first (DESIGN_SYSTEM.md §7). */

export type Locale = 'sw' | 'en';

type Dict = Record<string, { sw: string; en: string }>;

const strings = {
  IN_STOCK: { sw: 'Ipo stoo', en: 'In stock' },
  RESERVED: { sw: 'Imehifadhiwa', en: 'Reserved' },
  SOLD: { sw: 'Imeuzwa', en: 'Sold' },
  DELIVERED: { sw: 'Imefikishwa', en: 'Delivered' },
  RETURNED: { sw: 'Imerudishwa', en: 'Returned' },
  FAILED: { sw: 'Imeshindikana', en: 'Failed' },
  offlineQueued: { sw: 'Inasubiri mtandao', en: 'Waiting for network' },
  offlineConflicts: { sw: 'Kuna migongano — angalia', en: 'Conflicts need review' },
  copySerial: { sw: 'Nakili namba', en: 'Copy serial' },
  overdueDays: { sw: 'siku za ucheleweshaji', en: 'days overdue' },
} satisfies Dict;

export type StringKey = keyof typeof strings;

export function t(key: StringKey, locale: Locale): string {
  return strings[key][locale];
}

/**
 * Locale persistence (owner decision 2026-07-18: default ENGLISH, choice
 * survives refresh). Pure helpers so they unit-test without a DOM; the
 * usePersistedLocale hook wraps them for React surfaces. Guarded storage
 * access keeps this module safe for the API's React-free /i18n subpath.
 */
export const LOCALE_STORAGE_KEY = 'biashara-locale-v1';
export const DEFAULT_LOCALE: Locale = 'en';

export function readLocale(raw: string | null | undefined, fallback: Locale = DEFAULT_LOCALE): Locale {
  return raw === 'sw' || raw === 'en' ? raw : fallback;
}

export function loadLocale(fallback: Locale = DEFAULT_LOCALE): Locale {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    return readLocale(localStorage.getItem(LOCALE_STORAGE_KEY), fallback);
  } catch {
    return fallback;
  }
}

export function saveLocale(locale: Locale): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* storage full/blocked — the session keeps its in-memory choice */
  }
}

/**
 * THE user-facing date format: dd/MM/yyyy (DESIGN_SYSTEM.md §7).
 * Accepts ISO date strings (YYYY-MM-DD, with or without time) or Date.
 * ISO stays for wire formats and machine contexts only.
 */
export function formatDate(value: string | Date): string {
  const iso = value instanceof Date ? value.toISOString() : value;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return String(value);
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/** dd/MM/yyyy HH:mm for timestamps (receipts). */
export function formatDateTime(value: string | Date): string {
  const iso = value instanceof Date ? value.toISOString() : value;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
  if (!m) return formatDate(value);
  return `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}`;
}
