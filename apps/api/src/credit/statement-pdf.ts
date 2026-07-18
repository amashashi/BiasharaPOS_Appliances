import PDFDocument from 'pdfkit';
import { brand, color } from '@biashara/ui/tokens';
import { formatDate } from '@biashara/ui/i18n';
import type { Tzs } from '@biashara/shared';
import type { Merchant } from '../db/entities/merchant.entity.js';
import type { SalesOrder } from '../db/entities/sales-order.entity.js';
import type { Customer } from '../db/entities/customer.entity.js';
import type { CreditAgreement } from '../db/entities/credit-agreement.entity.js';
import type { CreditScheduleRow } from '../db/entities/credit-schedule-row.entity.js';
import type { Payment } from '../db/entities/payment.entity.js';
import { formatOrderNumber } from '../orders/orders.service.js';

const tzs = (n: Tzs): string => `TZS ${n.toLocaleString('en-US')}`;

export interface StatementData {
  merchant: Merchant;
  order: SalesOrder;
  customer: Customer;
  agreement: CreditAgreement;
  schedule: CreditScheduleRow[];
  payments: Payment[];
  /** Ledger truth (computed, never stored): Σ payments and principal − Σ. */
  paidTzs: Tzs;
  balanceTzs: Tzs;
}

const ROW_STATUS_SW: Record<string, string> = {
  PENDING: 'Inasubiri',
  PARTIAL: 'Sehemu',
  PAID: 'Imelipwa',
  OVERDUE: 'Imechelewa',
};

/**
 * Per-agreement customer statement (T3.5): A4, bilingual, dd/MM/yyyy,
 * integer TZS tabular. Sections: agreement summary → payment schedule →
 * payment history (the ledger, reversals included) → balance. Every total is
 * computed from the same sources the API serves — the statement can never
 * disagree with the ledger. `compress:false` keeps text assertable (D-023).
 */
export function renderStatementPdf(data: StatementData): Promise<Buffer> {
  const { merchant, order, customer, agreement, schedule, payments, paidTzs, balanceTzs } = data;
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50, compress: false });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const page = doc.page.width - 100;
    const right = (x: number, w: number, yy: number, s: string): void => {
      doc.text(s, x, yy, { width: w, align: 'right' });
    };

    // ── brand header (same treatment as the quote PDF) ──
    doc.rect(50, 50, page, 4).fill(brand.primary);
    doc.fillColor(brand.primary).fontSize(18).font('Helvetica-Bold')
      .text('BiasharaPOS', 50, 66, { continued: true })
      .fillColor(brand.subBrand).fontSize(11)
      .text('  APPLIANCES & ELECTRONICS', { baseline: 'bottom' });
    doc.fillColor(color.ink).fontSize(11).font('Helvetica-Bold').text(merchant.name, 50, 96);
    doc.fillColor(color.ink2).fontSize(9).font('Helvetica');
    if (merchant.tin) doc.text(`TIN: ${merchant.tin}`);
    if (merchant.phone) doc.text(`Simu / Phone: ${merchant.phone}`);

    // ── title + parties ──
    doc.moveDown(1.2);
    doc.fillColor(color.ink).fontSize(15).font('Helvetica-Bold')
      .text(`TAARIFA YA MKOPO / CREDIT STATEMENT  ${formatOrderNumber(order.number)}`);
    doc.fillColor(color.ink2).fontSize(9).font('Helvetica')
      .text(`Tarehe / Date: ${formatDate(new Date())}`)
      .text(`Mteja / Customer: ${customer.name}${customer.phone ? ` · ${customer.phone}` : ''}`)
      .text(`Aina / Type: ${agreement.type} · Hali / Status: ${agreement.status}`);

    // ── agreement summary ──
    doc.moveDown(0.8);
    const sumY = doc.y;
    doc.fontSize(9).font('Helvetica').fillColor(color.ink2);
    doc.text('Thamani / Principal', 50, sumY, { width: 160 });
    doc.text('Amana / Deposit', 215, sumY, { width: 160 });
    doc.text('Inayodaiwa / Financed', 380, sumY, { width: 165 });
    doc.font('Helvetica-Bold').fontSize(12).fillColor(color.ink);
    const sumY2 = doc.y + 2;
    doc.text(tzs(agreement.principalTzs), 50, sumY2, { width: 160 });
    doc.text(tzs(agreement.depositTzs), 215, sumY2, { width: 160 });
    doc.fillColor(brand.subBrand).text(tzs(agreement.principalTzs - agreement.depositTzs), 380, sumY2, { width: 165 });

    // ── schedule ──
    doc.moveDown(1.4);
    doc.fillColor(color.ink).fontSize(11).font('Helvetica-Bold').text('RATIBA YA MALIPO / PAYMENT SCHEDULE', 50, doc.y);
    doc.moveDown(0.4);
    const sc = { seq: 50, due: 80, amount: 210, paid: 320, status: 430 };
    let y = doc.y;
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('#', sc.seq, y, { width: 24 });
    doc.text('Tarehe / Due', sc.due, y, { width: 120 });
    right(sc.amount, 100, y, 'Kiasi / Amount');
    right(sc.paid, 100, y, 'Imelipwa / Paid');
    doc.text('Hali / Status', sc.status, y, { width: 115 });
    doc.moveTo(50, doc.y + 3).lineTo(50 + page, doc.y + 3).strokeColor(color.line2).stroke();
    doc.moveDown(0.4);
    doc.font('Helvetica').fillColor(color.ink);
    for (const row of schedule) {
      y = doc.y;
      doc.text(String(row.seq), sc.seq, y, { width: 24 });
      doc.text(formatDate(row.dueDate), sc.due, y, { width: 120 });
      right(sc.amount, 100, y, tzs(row.amountTzs));
      right(sc.paid, 100, y, tzs(row.paidTzs));
      doc.text(`${ROW_STATUS_SW[row.status] ?? row.status} / ${row.status}`, sc.status, y, { width: 115 });
      doc.moveDown(0.35);
    }

    // ── payment history (the ledger — reversals included) ──
    doc.moveDown(0.9);
    doc.fillColor(color.ink).fontSize(11).font('Helvetica-Bold').text('MALIPO YALIYOFANYIKA / PAYMENT HISTORY', 50, doc.y);
    doc.moveDown(0.4);
    const pc = { date: 50, method: 170, note: 300, amount: 470 };
    y = doc.y;
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Tarehe / Date', pc.date, y, { width: 110 });
    doc.text('Njia / Method', pc.method, y, { width: 120 });
    doc.text('Maelezo / Note', pc.note, y, { width: 160 });
    right(pc.amount, 75, y, 'Kiasi / Amount');
    doc.moveTo(50, doc.y + 3).lineTo(50 + page, doc.y + 3).strokeColor(color.line2).stroke();
    doc.moveDown(0.4);
    doc.font('Helvetica');
    for (const p of payments) {
      y = doc.y;
      const reversal = p.reversesPaymentId !== null;
      doc.fillColor(color.ink);
      doc.text(formatDate(p.at), pc.date, y, { width: 110 });
      doc.text(p.method, pc.method, y, { width: 120 });
      doc.text(reversal ? 'Marejesho / Reversal' : (p.note ?? '—'), pc.note, y, { width: 160 });
      doc.fillColor(p.amountTzs < 0 ? color.red : color.ink);
      right(pc.amount, 75, y, tzs(p.amountTzs));
      doc.moveDown(0.35);
    }

    // ── balance ──
    doc.moveTo(280, doc.y + 4).lineTo(50 + page, doc.y + 4).strokeColor(color.line2).stroke();
    doc.moveDown(0.7);
    y = doc.y;
    doc.font('Helvetica-Bold').fontSize(10).fillColor(color.ink);
    right(280, 190, y, 'JUMLA ILIYOLIPWA / TOTAL PAID');
    doc.fillColor(brand.secondary);
    right(pc.amount, 75, y, tzs(paidTzs));
    doc.moveDown(0.5);
    y = doc.y;
    doc.fillColor(color.ink);
    right(280, 190, y, 'SALIO / BALANCE DUE');
    doc.fillColor(balanceTzs > 0 ? color.red : brand.secondary);
    right(pc.amount, 75, y, tzs(balanceTzs));

    // ── footer ──
    doc.moveDown(2);
    doc.fontSize(8).font('Helvetica').fillColor(color.ink3)
      .text(
        'Taarifa hii ni ya mkopo wa duka; si risiti ya kodi (TRA). Risiti za kodi hutolewa kwa kila malipo. / ' +
          'This is a retailer credit statement, not a fiscal receipt. Fiscal receipts are issued per payment.',
        50, doc.y, { width: page },
      );

    doc.end();
  });
}
