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
