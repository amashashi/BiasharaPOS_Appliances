#!/usr/bin/env node
/**
 * i18n coverage lint (T6.3). Scans every tracked source file for the bilingual
 * `{ sw, en }` string pairs the UI uses and fails if any key is "untranslated" —
 * i.e. the Swahili copy is empty or identical to the English (a forgotten
 * translation that would show English text after switching to Swahili). The
 * TypeScript `satisfies Dict` type already guarantees both languages are
 * PRESENT; this guarantees they are actually DIFFERENT.
 *
 * Wired into `npm run lint` so it runs in CI. Add a genuinely-identical pair
 * (e.g. a brand name that lives in a dict) to ALLOW below, with a reason.
 */
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

/** Pairs that are legitimately identical in both languages (key → why). */
const ALLOW = new Set([
  // e.g. 'TZS' — currency codes, brand names. Empty for now: everything is translated.
]);

const files = execSync('git ls-files apps packages', { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter((f) => /\.(ts|tsx)$/.test(f) && !f.includes('/dist/'));

// matches  sw: '…'  or  en: "…"  (handles escaped quotes); dicts are sw-then-en
const TOKEN = /\b(sw|en):\s*(["'])((?:\\.|(?!\2).)*)\2/g;

const violations = [];
let pairs = 0;

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const toks = [...src.matchAll(TOKEN)].map((m) => ({ k: m[1], v: m[3], index: m.index }));
  for (let i = 0; i < toks.length - 1; i++) {
    if (toks[i].k !== 'sw' || toks[i + 1].k !== 'en') continue;
    pairs += 1;
    const sw = toks[i].v.trim();
    const en = toks[i + 1].v.trim();
    const line = src.slice(0, toks[i].index).split('\n').length;
    if (sw === '' || en === '') {
      violations.push({ file, line, reason: 'empty translation', sw, en });
    } else if (sw === toks[i + 1].v.trim() && sw === en && !ALLOW.has(en)) {
      violations.push({ file, line, reason: 'Swahili identical to English (untranslated)', sw, en });
    }
    i += 1; // consume the paired en
  }
}

if (violations.length > 0) {
  console.error(`\ni18n check FAILED — ${violations.length} untranslated key(s):\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  ${v.reason}\n      sw="${v.sw}"  en="${v.en}"`);
  }
  console.error(`\nTranslate the Swahili copy, or (if genuinely identical) add it to ALLOW in scripts/check-i18n.mjs.\n`);
  process.exit(1);
}

console.log(`i18n check OK — ${pairs} bilingual pairs, all translated.`);
