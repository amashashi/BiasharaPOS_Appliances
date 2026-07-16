import { color } from './tokens.js';

/**
 * Receipt/statement header template (T0.7) — self-contained HTML for 80mm
 * thermal receipts and A4 statements. The icon is INLINED (thermal print HTML
 * must not fetch assets); source of truth is brand/logo-appliances-icon.svg
 * (D-016) — keep in sync if the mark ever changes.
 */

const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="44" height="44" role="img" aria-label="BiasharaPOS Appliances mark"><rect x="0" y="0" width="96" height="96" rx="22" fill="${color.green}"/><circle cx="48" cy="57" r="17.5" fill="none" stroke="${color.white}" stroke-width="6.5" stroke-linecap="round" pathLength="100" stroke-dasharray="80 20" stroke-dashoffset="15"/><path d="M54 11 L37 37 L46.5 37 L43.5 55 L61 29 L50.5 29 Z" fill="${color.white}" stroke="${color.green}" stroke-width="2" stroke-linejoin="round"/></svg>`;

export interface ReceiptHeaderOpts {
  merchantName: string;
  tin: string;
  locationName?: string;
  phone?: string;
}

/** Header block for receipts/statements. The VFD QR + verification code block (T2.4) renders at the FOOTER, never here. */
export function receiptHeaderHtml(opts: ReceiptHeaderOpts): string {
  const sub = [opts.locationName, opts.phone].filter(Boolean).join(' · ');
  return `<header style="display:flex;align-items:center;gap:10px;padding-bottom:8px;border-bottom:1px dashed ${color.line2};font-family:'Plus Jakarta Sans',system-ui,sans-serif;">
  ${ICON_SVG}
  <div>
    <div style="font-weight:800;font-size:15px;color:${color.ink};">${escapeHtml(opts.merchantName)}</div>
    <div style="font-size:11px;color:${color.ink2};">TIN: ${escapeHtml(opts.tin)}${sub ? ' · ' + escapeHtml(sub) : ''}</div>
    <div style="font-size:9px;letter-spacing:0.15em;color:${color.steel};font-weight:600;">BIASHARAPOS · APPLIANCES &amp; ELECTRONICS</div>
  </div>
</header>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
