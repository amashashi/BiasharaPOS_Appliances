import QRCode from 'qrcode';
import { color } from '@biashara/ui/tokens';
import { receiptHeaderHtml } from '@biashara/ui/receipt';
import { formatDateTime } from '@biashara/ui/i18n';
import type { Tzs } from '@biashara/shared';
import type { Merchant } from '../db/entities/merchant.entity.js';
import type { SalesOrder } from '../db/entities/sales-order.entity.js';
import type { Payment } from '../db/entities/payment.entity.js';
import type { FiscalReceipt } from '../db/entities/fiscal-receipt.entity.js';
import { buildFiscalDraft } from './receipt-draft.js';
import { formatOrderNumber } from '../orders/orders.service.js';

const tzs = (n: Tzs): string => `TZS ${n.toLocaleString('en-US')}`;
const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * 80mm fiscal receipt (T2.4): design-system header (T0.7), the same items the
 * VFD draft carried, and the TRA footer — VFD number, verification code, QR.
 * Self-contained HTML (inline styles, inlined QR SVG) — thermal printers
 * fetch nothing. Reprints render identically from the stored receipt.
 */
export async function renderReceiptHtml(
  merchant: Merchant,
  order: SalesOrder,
  payment: Payment,
  fiscal: FiscalReceipt,
): Promise<string> {
  const draft = buildFiscalDraft(merchant, order, payment);
  const qrSvg = await QRCode.toString(fiscal.qrUrl, { type: 'svg', margin: 0, width: 110 });

  const rows = draft.items
    .map(
      (i) => `<tr>
        <td style="padding:2px 0;">${esc(i.description)}${i.quantity > 1 ? ` ×${i.quantity}` : ''}</td>
        <td style="padding:2px 0;text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums;">${tzs(i.quantity * i.unitPriceTzs)}</td>
      </tr>`,
    )
    .join('\n');

  return `<!-- 80mm fiscal receipt — ${fiscal.vfdNumber} -->
<div style="width:280px;margin:0 auto;font-family:'Plus Jakarta Sans',system-ui,sans-serif;color:${color.ink};font-size:12px;">
  ${receiptHeaderHtml({
    merchantName: merchant.name,
    tin: merchant.tin ?? '-',
    locationName: order.location?.name,
    phone: merchant.phone ?? undefined,
  })}
  <div style="padding:6px 0;border-bottom:1px dashed ${color.line2};">
    <div style="font-weight:800;">RISITI YA KODI / FISCAL RECEIPT</div>
    <div style="color:${color.ink2};">${formatOrderNumber(order.number)} · ${formatDateTime(fiscal.issuedAt)}</div>
    ${order.customer ? `<div style="color:${color.ink2};">Mteja / Customer: ${esc(order.customer.name)}</div>` : ''}
  </div>
  <table style="width:100%;border-collapse:collapse;margin:6px 0;">
    ${rows}
    <tr>
      <td style="padding:6px 0 2px;font-weight:800;">JUMLA / TOTAL (${esc(payment.method)})</td>
      <td style="padding:6px 0 2px;text-align:right;font-weight:800;color:${color.green};font-variant-numeric:tabular-nums;">${tzs(payment.amountTzs)}</td>
    </tr>
  </table>
  <footer style="border-top:1px dashed ${color.line2};padding-top:8px;text-align:center;">
    <div style="font-weight:700;">VFD: ${esc(fiscal.vfdNumber)}</div>
    <div style="color:${color.ink2};">Msimbo / Verification: ${esc(fiscal.verificationCode)}</div>
    <div style="display:flex;justify-content:center;padding:8px 0;">${qrSvg}</div>
    <div style="font-size:10px;color:${color.ink3};">Hakiki risiti hii TRA / Verify this receipt with TRA</div>
  </footer>
</div>`;
}
