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
