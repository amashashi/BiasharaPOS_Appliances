import { useState } from 'react';
import { DEFAULT_LOCALE, loadLocale, saveLocale, type Locale } from '../i18n.js';

/**
 * Locale state that survives refresh (localStorage, per app origin).
 * Default is English (owner decision 2026-07-18); Swahili remains
 * first-class per DESIGN_SYSTEM.md §7 — this only sets the initial pick.
 */
export function usePersistedLocale(fallback: Locale = DEFAULT_LOCALE): [Locale, (l: Locale) => void] {
  const [locale, setLocale] = useState<Locale>(() => loadLocale(fallback));
  const set = (l: Locale): void => {
    saveLocale(l);
    setLocale(l);
  };
  return [locale, set];
}
