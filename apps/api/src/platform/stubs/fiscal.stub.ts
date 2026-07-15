import type { FiscalReceipt, FiscalReceiptDraft, FiscalService } from '@biashara/shared';

/**
 * Stub VFD fiscalization: sequential receipt numbers, deterministic verification
 * codes, idempotent by draft.idempotencyKey. `failNext(n)` simulates TRA outages
 * for retry-queue tests (T2.4).
 */
export class StubFiscalService implements FiscalService {
  private seq = 0;
  private failuresRemaining = 0;
  private readonly issued = new Map<string, FiscalReceipt>();

  failNext(count: number): void {
    this.failuresRemaining = count;
  }

  async issueReceipt(draft: FiscalReceiptDraft): Promise<FiscalReceipt> {
    const existing = this.issued.get(draft.idempotencyKey);
    if (existing) return existing;

    if (this.failuresRemaining > 0) {
      this.failuresRemaining -= 1;
      throw new Error('STUB_VFD_UNAVAILABLE');
    }

    if (!draft.merchantTin) throw new Error('STUB_VFD_MISSING_TIN');
    const total = draft.items.reduce((s, i) => s + i.quantity * i.unitPriceTzs, 0);
    if (total !== draft.payment.amountTzs) {
      // stub enforces the invariant loosely: receipt total must equal payment amount
      throw new Error('STUB_VFD_AMOUNT_MISMATCH');
    }

    this.seq += 1;
    const receipt: FiscalReceipt = {
      vfdNumber: `STUB-VFD-${String(this.seq).padStart(8, '0')}`,
      verificationCode: `VC${this.seq.toString(36).toUpperCase().padStart(6, '0')}`,
      qrUrl: `https://verify.tra.go.tz/stub/${this.seq}`,
      issuedAt: new Date().toISOString(),
    };
    this.issued.set(draft.idempotencyKey, receipt);
    return receipt;
  }
}
