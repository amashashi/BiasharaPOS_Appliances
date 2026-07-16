import PDFDocument from 'pdfkit';
import { brand, color } from '@biashara/ui/tokens';
import type { Tzs } from '@biashara/shared';
import type { Merchant } from '../db/entities/merchant.entity.js';
import type { SalesOrder } from '../db/entities/sales-order.entity.js';
import type { OrderTotals } from './orders.service.js';
import { formatOrderNumber } from './orders.service.js';

const tzs = (n: Tzs): string => `TZS ${n.toLocaleString('en-US')}`;

/**
 * Printable/shareable quotation PDF (T2.1). Branding placeholder per the
 * verify clause: brand bar + wordmark text in canonical colors (tokens only);
 * the drawn logo mark joins when receipts land (T2.4). Bilingual sw/en.
 * `compress: false` keeps text greppable for tests; size is negligible.
 */
export function renderQuotePdf(
  merchant: Merchant,
  order: SalesOrder & { totals: OrderTotals },
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50, compress: false });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const page = doc.page.width - 100; // usable width

    // ── brand header (placeholder lockup) ──
    doc.rect(50, 50, page, 4).fill(brand.primary);
    doc.moveDown(0.8);
    doc.fillColor(brand.primary).fontSize(18).font('Helvetica-Bold')
      .text('BiasharaPOS', 50, 66, { continued: true })
      .fillColor(brand.subBrand).fontSize(11)
      .text('  APPLIANCES & ELECTRONICS', { baseline: 'bottom' });
    doc.fillColor(color.ink).fontSize(11).font('Helvetica-Bold').text(merchant.name, 50, 96);
    doc.fillColor(color.ink2).fontSize(9).font('Helvetica');
    if (merchant.tin) doc.text(`TIN: ${merchant.tin}`);
    if (merchant.phone) doc.text(`Simu / Phone: ${merchant.phone}`);

    // ── title + meta ──
    doc.moveDown(1.2);
    doc.fillColor(color.ink).fontSize(15).font('Helvetica-Bold')
      .text(`KADIRIO / QUOTATION  ${formatOrderNumber(order.number)}`);
    doc.fillColor(color.ink2).fontSize(9).font('Helvetica')
      .text(`Tarehe / Date: ${order.createdAt.toISOString().slice(0, 10)}`)
      .text(`Mahali / Location: ${order.location?.name ?? '-'}`);
    if (order.customer) {
      doc.text(
        `Mteja / Customer: ${order.customer.name}${order.customer.phone ? ` · ${order.customer.phone}` : ''}`,
      );
    }

    // ── lines table ──
    doc.moveDown(1);
    const cols = { item: 50, qty: 330, unit: 390, total: 470 };
    const rowY = (): number => doc.y;
    doc.fontSize(9).font('Helvetica-Bold').fillColor(color.ink);
    let y = rowY();
    doc.text('Bidhaa / Item', cols.item, y, { width: 270 });
    doc.text('Idadi', cols.qty, y, { width: 50, align: 'right' });
    doc.text('Bei / Unit', cols.unit, y, { width: 70, align: 'right' });
    doc.text('Jumla / Total', cols.total, y, { width: 75, align: 'right' });
    doc.moveTo(50, doc.y + 3).lineTo(50 + page, doc.y + 3).strokeColor(color.line2).stroke();
    doc.moveDown(0.5);

    doc.font('Helvetica').fillColor(color.ink);
    for (const line of order.lines) {
      y = rowY();
      const name = `${line.product?.brand ?? ''} ${line.product?.model ?? ''}`.trim();
      doc.text(name, cols.item, y, { width: 270 });
      doc.text(String(line.qty), cols.qty, y, { width: 50, align: 'right' });
      doc.text(tzs(line.unitPriceTzs), cols.unit, y, { width: 70, align: 'right' });
      doc.text(tzs(line.qty * line.unitPriceTzs), cols.total, y, { width: 75, align: 'right' });
      doc.moveDown(0.4);
    }
    for (const s of order.serviceLines ?? []) {
      y = rowY();
      const label = s.kind === 'DELIVERY' ? 'Usafirishaji / Delivery' : 'Ufungaji / Installation';
      doc.text(label + (s.note ? ` — ${s.note}` : ''), cols.item, y, { width: 270 });
      doc.text('1', cols.qty, y, { width: 50, align: 'right' });
      doc.text(tzs(s.priceTzs), cols.unit, y, { width: 70, align: 'right' });
      doc.text(tzs(s.priceTzs), cols.total, y, { width: 75, align: 'right' });
      doc.moveDown(0.4);
    }

    // ── totals ──
    doc.moveTo(300, doc.y + 3).lineTo(50 + page, doc.y + 3).strokeColor(color.line2).stroke();
    doc.moveDown(0.6);
    y = rowY();
    doc.font('Helvetica-Bold').fillColor(color.ink)
      .text('JUMLA / TOTAL', cols.qty, y, { width: 130, align: 'right' });
    doc.fillColor(brand.secondary)
      .text(tzs(order.totals.totalTzs), cols.total, y, { width: 75, align: 'right' });

    // ── footer ──
    doc.moveDown(2);
    doc.fontSize(8).font('Helvetica').fillColor(color.ink3)
      .text(
        'Hili ni kadirio, si risiti ya kodi (TRA). Bei zinaweza kubadilika bila taarifa. / ' +
          'This is a quotation, not a fiscal receipt. Prices are subject to change without notice.',
        50, doc.y, { width: page },
      );

    doc.end();
  });
}
