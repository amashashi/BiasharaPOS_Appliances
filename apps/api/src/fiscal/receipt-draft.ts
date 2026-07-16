import type { FiscalLineItem, FiscalReceiptDraft } from '@biashara/shared';
import type { Merchant } from '../db/entities/merchant.entity.js';
import type { Payment } from '../db/entities/payment.entity.js';
import type { SalesOrder } from '../db/entities/sales-order.entity.js';
import { formatOrderNumber } from '../orders/orders.service.js';

/**
 * Per-payment fiscalization (D-008 working assumption): a payment covering
 * the FULL order total itemizes the order (overpayment is impossible, so
 * amount === total means it's the only payment); a partial payment (deposit)
 * fiscalizes as one summary line — the stub (and TRA) require receipt items
 * to sum to the paid amount. Final treatment confirmed at T5.2.
 */
export function buildFiscalDraft(
  merchant: Merchant,
  order: SalesOrder,
  payment: Payment,
): FiscalReceiptDraft {
  const totalTzs =
    order.lines.reduce((s, l) => s + l.qty * l.unitPriceTzs, 0) +
    order.serviceLines.reduce((s, l) => s + l.priceTzs, 0);

  let items: FiscalLineItem[];
  if (payment.amountTzs === totalTzs) {
    items = [
      ...order.lines.map((l) => ({
        description: `${l.product.brand} ${l.product.model}`,
        quantity: l.qty,
        unitPriceTzs: l.unitPriceTzs,
        taxCode: l.product.taxCode,
      })),
      ...order.serviceLines.map((s) => ({
        description: s.kind === 'DELIVERY' ? 'Usafirishaji / Delivery' : 'Ufungaji / Installation',
        quantity: 1,
        unitPriceTzs: s.priceTzs,
        taxCode: 'A',
      })),
    ];
  } else {
    items = [
      {
        description: `Malipo / Payment — ${formatOrderNumber(order.number)} (deposit)`,
        quantity: 1,
        unitPriceTzs: payment.amountTzs,
        taxCode: 'A',
      },
    ];
  }

  return {
    merchantTin: merchant.tin ?? '',
    items,
    payment: { method: payment.method, amountTzs: payment.amountTzs },
    customerTin: order.customer?.tin ?? undefined,
    idempotencyKey: payment.id, // retries and offline replays reuse it (T5.7)
  };
}
