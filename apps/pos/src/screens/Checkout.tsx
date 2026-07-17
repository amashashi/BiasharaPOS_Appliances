import { useEffect, useRef, useState } from 'react';
import {
  Button, MoneyDisplay, color, font, fontSize, fontWeight, radius, space, type Locale,
} from '@biashara/ui';
import {
  createOrder, devResolveMm, getReceiptHtml, initiateMm, listMm, recordCash, searchProducts,
  type ProductHit, type Session,
} from '../api.js';
import { addToCart, cartTotalTzs, changeQty, validDeposit, type CartLine } from '../cart.js';
import { ts } from '../strings.js';

const card: React.CSSProperties = {
  background: color.surface,
  border: `1px solid ${color.line}`,
  borderRadius: radius.md,
};
const input: React.CSSProperties = {
  width: '100%',
  minHeight: 48,
  padding: `${space.s2}px ${space.s3}px`,
  fontFamily: font.sans,
  fontSize: fontSize.bodyLg,
  border: `1px solid ${color.line2}`,
  borderRadius: radius.sm,
  boxSizing: 'border-box',
};

type PayPhase =
  | { step: 'form' }
  | { step: 'mmPending'; orderId: string; intentId: string }
  | { step: 'receipt'; orderId: string; paymentId: string; html: string | null }
  | { step: 'error'; message: string };

export function Checkout({
  session, locale, onLocale, onSignOut,
}: {
  session: Session;
  locale: Locale;
  onLocale: (l: Locale) => void;
  onSignOut: () => void;
}) {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<ProductHit[]>([]);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [paying, setPaying] = useState(false);
  const [phase, setPhase] = useState<PayPhase>({ step: 'form' });
  const [kind, setKind] = useState<'FULL' | 'DEPOSIT'>('FULL');
  const [method, setMethod] = useState<'CASH' | 'MM'>('CASH');
  const [depositTzs, setDepositTzs] = useState('');
  const [provider, setProvider] = useState('MPESA');
  const [msisdn, setMsisdn] = useState('+255');
  const [busy, setBusy] = useState(false);

  const total = cartTotalTzs(lines);
  const amountTzs = kind === 'FULL' ? total : Number(depositTzs || 0);
  const amountOk = kind === 'FULL' ? total > 0 : validDeposit(lines, amountTzs);

  // debounced search
  useEffect(() => {
    const h = setTimeout(() => {
      searchProducts(session, query)
        .then((r) => setHits(r.items))
        .catch(() => setHits([]));
    }, 250);
    return () => clearTimeout(h);
  }, [query, session]);

  // poll a pending mobile-money intent
  useEffect(() => {
    if (phase.step !== 'mmPending') return;
    let stop = false;
    const tick = async (): Promise<void> => {
      try {
        const { items } = await listMm(session, phase.orderId);
        const intent = items.find((i) => i.intentId === phase.intentId);
        if (stop || !intent) return;
        if (intent.status === 'CONFIRMED' && intent.appliedPaymentId) {
          setPhase({ step: 'receipt', orderId: phase.orderId, paymentId: intent.appliedPaymentId, html: null });
        } else if (intent.status === 'CONFIRMED') {
          setPhase({ step: 'error', message: 'Confirmed but unapplied — see back office' });
        } else if (intent.status === 'FAILED') {
          setPhase({ step: 'error', message: ts('pushFailed', locale) });
        }
      } catch {
        /* poll again */
      }
    };
    const h = setInterval(() => void tick(), 1200);
    return () => {
      stop = true;
      clearInterval(h);
    };
  }, [phase, session, locale]);

  // poll the fiscal receipt once a payment exists
  useEffect(() => {
    if (phase.step !== 'receipt' || phase.html !== null) return;
    let stop = false;
    const h = setInterval(() => {
      void getReceiptHtml(session, phase.orderId, phase.paymentId).then((html) => {
        if (!stop && html) setPhase({ ...phase, html });
      });
    }, 600);
    return () => {
      stop = true;
      clearInterval(h);
    };
  }, [phase, session]);

  const makeOrderPayload = () => ({
    type: 'ORDER' as const,
    locationId: session.locationId,
    ...(custName.trim()
      ? { customer: { name: custName.trim(), ...(custPhone.trim() ? { phone: custPhone.trim() } : {}) } }
      : {}),
    lines: lines.map((l) => ({ productId: l.product.id, qty: l.qty })),
  });

  const payCash = async (): Promise<void> => {
    setBusy(true);
    try {
      const order = await createOrder(session, makeOrderPayload());
      const paid = await recordCash(session, order.id, amountTzs);
      setPhase({ step: 'receipt', orderId: order.id, paymentId: paid.payment.id, html: null });
    } catch (e) {
      setPhase({ step: 'error', message: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const payMm = async (): Promise<void> => {
    setBusy(true);
    try {
      const order = await createOrder(session, makeOrderPayload());
      const intent = await initiateMm(session, order.id, { provider, msisdn: msisdn.trim(), amountTzs });
      setPhase({ step: 'mmPending', orderId: order.id, intentId: intent.intentId });
    } catch (e) {
      setPhase({ step: 'error', message: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const newSale = (): void => {
    setLines([]);
    setCustName('');
    setCustPhone('');
    setDepositTzs('');
    setKind('FULL');
    setMethod('CASH');
    setPaying(false);
    setPhase({ step: 'form' });
  };

  return (
    <main style={{ fontFamily: font.sans, minHeight: '100vh', background: color.bg, color: color.ink, display: 'flex', flexDirection: 'column' }}>
      {/* header */}
      <header style={{ display: 'flex', alignItems: 'center', gap: space.s3, padding: `${space.s2}px ${space.s4}px`, background: color.surface, borderBottom: `1px solid ${color.line}` }}>
        <img src="/logo-icon.svg" alt="" style={{ width: 34, height: 34 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: fontWeight.bold }}>{session.merchant.name}</div>
          <div style={{ fontSize: fontSize.sm, color: color.ink3 }}>
            {session.locationName} · {session.displayName} ({session.role})
          </div>
        </div>
        <Button variant="ghost" onClick={() => onLocale(locale === 'sw' ? 'en' : 'sw')}>
          {locale === 'sw' ? 'English' : 'Kiswahili'}
        </Button>
        <Button variant="ghost" onClick={onSignOut}>{ts('signOut', locale)}</Button>
      </header>

      <div style={{ display: 'flex', gap: space.s4, padding: space.s4, flex: 1, minHeight: 0 }}>
        {/* left: search + results */}
        <section style={{ flex: 1.4, display: 'flex', flexDirection: 'column', gap: space.s3 }}>
          <input
            style={{ ...input, background: color.surface }}
            placeholder={ts('searchPlaceholder', locale)}
            value={query}
            autoFocus
            onChange={(e) => setQuery(e.target.value)}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: space.s3, overflowY: 'auto', alignContent: 'start' }}>
            {hits.map((p) => (
              <button
                key={p.id}
                onClick={() => setLines(addToCart(lines, p))}
                style={{ ...card, padding: space.s3, textAlign: 'left', cursor: 'pointer', fontFamily: font.sans, minHeight: 88 }}
              >
                <div style={{ fontWeight: fontWeight.semibold, fontSize: fontSize.body }}>
                  {p.brand} {p.model}
                </div>
                <div style={{ fontSize: fontSize.sm, color: color.ink3, margin: `${space.s1}px 0` }}>
                  {p.sku ?? p.category}
                </div>
                <MoneyDisplay amountTzs={p.priceTzs} variant="positive" />
              </button>
            ))}
            {hits.length === 0 && (
              <div style={{ color: color.ink3, padding: space.s4 }}>{ts('noResults', locale)}</div>
            )}
          </div>
        </section>

        {/* right: cart */}
        <section style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: space.s3, minWidth: 340 }}>
          <div style={{ ...card, flex: 1, padding: space.s3, overflowY: 'auto' }}>
            <div style={{ fontWeight: fontWeight.bold, marginBottom: space.s2 }}>{ts('cart', locale)}</div>
            {lines.length === 0 && <div style={{ color: color.ink3 }}>{ts('cartEmpty', locale)}</div>}
            {lines.map((l) => (
              <div key={l.product.id} style={{ display: 'flex', alignItems: 'center', gap: space.s2, padding: `${space.s2}px 0`, borderBottom: `1px dashed ${color.line}` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: fontSize.body, fontWeight: fontWeight.semibold }}>
                    {l.product.brand} {l.product.model}
                  </div>
                  <MoneyDisplay amountTzs={l.qty * l.product.priceTzs} />
                </div>
                <Button variant="secondary" aria-label={`minus-${l.product.model}`} onClick={() => setLines(changeQty(lines, l.product.id, -1))}>−</Button>
                <span style={{ minWidth: 24, textAlign: 'center', fontWeight: fontWeight.bold }}>{l.qty}</span>
                <Button variant="secondary" aria-label={`plus-${l.product.model}`} onClick={() => setLines(changeQty(lines, l.product.id, 1))}>+</Button>
              </div>
            ))}
          </div>

          <div style={{ ...card, padding: space.s3 }}>
            <div style={{ fontWeight: fontWeight.bold, marginBottom: space.s2 }}>{ts('customer', locale)}</div>
            <div style={{ display: 'flex', gap: space.s2 }}>
              <input style={input} placeholder={ts('customerName', locale)} value={custName} onChange={(e) => setCustName(e.target.value)} />
              <input style={input} placeholder={ts('customerPhone', locale)} value={custPhone} onChange={(e) => setCustPhone(e.target.value)} />
            </div>
          </div>

          <div style={{ ...card, padding: space.s3, display: 'flex', alignItems: 'center', gap: space.s3 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: fontSize.sm, color: color.ink3 }}>{ts('total', locale)}</div>
              <MoneyDisplay amountTzs={total} variant="positive" size={26} />
            </div>
            <Button pos disabled={lines.length === 0} onClick={() => { setPaying(true); setPhase({ step: 'form' }); }}>
              {ts('pay', locale)}
            </Button>
          </div>
        </section>
      </div>

      {paying && (
        <PayModal
          locale={locale}
          phase={phase}
          kind={kind} setKind={setKind}
          method={method} setMethod={setMethod}
          depositTzs={depositTzs} setDepositTzs={setDepositTzs}
          provider={provider} setProvider={setProvider}
          msisdn={msisdn} setMsisdn={setMsisdn}
          amountTzs={amountTzs} amountOk={amountOk} busy={busy}
          onCash={() => void payCash()}
          onMm={() => void payMm()}
          onClose={() => setPaying(false)}
          onNewSale={newSale}
          onBackToForm={() => setPhase({ step: 'form' })}
        />
      )}
    </main>
  );
}

function PayModal(props: {
  locale: Locale;
  phase: PayPhase;
  kind: 'FULL' | 'DEPOSIT'; setKind: (k: 'FULL' | 'DEPOSIT') => void;
  method: 'CASH' | 'MM'; setMethod: (m: 'CASH' | 'MM') => void;
  depositTzs: string; setDepositTzs: (v: string) => void;
  provider: string; setProvider: (v: string) => void;
  msisdn: string; setMsisdn: (v: string) => void;
  amountTzs: number; amountOk: boolean; busy: boolean;
  onCash: () => void; onMm: () => void;
  onClose: () => void; onNewSale: () => void; onBackToForm: () => void;
}) {
  const { locale, phase } = props;
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const toggle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    minHeight: 48,
    fontFamily: font.sans,
    fontSize: fontSize.bodyLg,
    fontWeight: fontWeight.semibold,
    borderRadius: radius.sm,
    cursor: 'pointer',
    border: active ? `2px solid ${color.blue}` : `1px solid ${color.line2}`,
    background: active ? color.blue50 : color.surface,
    color: active ? color.blueD : color.ink2,
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(19,32,44,0.55)', display: 'grid', placeItems: 'center', zIndex: 10 }}>
      <div style={{ background: color.surface, borderRadius: radius.md, padding: space.s4, width: 460, maxWidth: '94vw', maxHeight: '92vh', overflowY: 'auto' }}>
        {phase.step === 'form' && (
          <>
            <div style={{ fontWeight: fontWeight.bold, fontSize: fontSize.h3, marginBottom: space.s3 }}>
              {ts('pay', locale)} — <MoneyDisplay amountTzs={props.amountTzs} variant="positive" />
            </div>
            <div style={{ display: 'flex', gap: space.s2, marginBottom: space.s3 }}>
              <button style={toggle(props.kind === 'FULL')} onClick={() => props.setKind('FULL')}>{ts('payFull', locale)}</button>
              <button style={toggle(props.kind === 'DEPOSIT')} onClick={() => props.setKind('DEPOSIT')}>{ts('deposit', locale)}</button>
            </div>
            {props.kind === 'DEPOSIT' && (
              <input
                style={{ ...input, marginBottom: space.s3 }}
                placeholder={ts('depositAmount', locale)}
                inputMode="numeric"
                value={props.depositTzs}
                onChange={(e) => props.setDepositTzs(e.target.value.replace(/[^\d]/g, ''))}
              />
            )}
            <div style={{ display: 'flex', gap: space.s2, marginBottom: space.s3 }}>
              <button style={toggle(props.method === 'CASH')} onClick={() => props.setMethod('CASH')}>{ts('cash', locale)}</button>
              <button style={toggle(props.method === 'MM')} onClick={() => props.setMethod('MM')}>{ts('mobileMoney', locale)}</button>
            </div>
            {props.method === 'MM' && (
              <div style={{ display: 'flex', gap: space.s2, marginBottom: space.s3 }}>
                <select style={{ ...input, flex: 1 }} value={props.provider} onChange={(e) => props.setProvider(e.target.value)}>
                  <option value="MPESA">M-Pesa</option>
                  <option value="MIXX_BY_YAS">Mixx by Yas</option>
                  <option value="AIRTEL_MONEY">Airtel Money</option>
                </select>
                <input style={{ ...input, flex: 1.2 }} placeholder={ts('phoneForPush', locale)} value={props.msisdn} onChange={(e) => props.setMsisdn(e.target.value)} />
              </div>
            )}
            <div style={{ display: 'flex', gap: space.s2 }}>
              <Button variant="secondary" pos style={{ flex: 1 }} onClick={props.onClose}>{ts('cancel', locale)}</Button>
              <Button
                pos
                style={{ flex: 2 }}
                loading={props.busy}
                disabled={!props.amountOk}
                onClick={props.method === 'CASH' ? props.onCash : props.onMm}
              >
                {props.method === 'CASH' ? ts('cash', locale) : ts('sendPush', locale)}
              </Button>
            </div>
          </>
        )}

        {phase.step === 'mmPending' && (
          <div style={{ textAlign: 'center', padding: space.s4 }}>
            <div style={{ fontSize: fontSize.h3, fontWeight: fontWeight.bold, marginBottom: space.s3 }}>
              {ts('mobileMoney', locale)}
            </div>
            <div style={{ color: color.ink2, marginBottom: space.s4 }}>{ts('awaitingApproval', locale)}</div>
            <div style={{ display: 'flex', gap: space.s2, justifyContent: 'center' }}>
              <Button variant="secondary" onClick={() => void devResolveMm(phase.intentId, 'CONFIRMED')}>
                {ts('simulateApprove', locale)}
              </Button>
              <Button variant="danger" onClick={() => void devResolveMm(phase.intentId, 'FAILED')}>
                {ts('simulateDecline', locale)}
              </Button>
            </div>
          </div>
        )}

        {phase.step === 'receipt' && (
          <>
            <div style={{ fontWeight: fontWeight.bold, fontSize: fontSize.h3, marginBottom: space.s2 }}>
              {ts('receipt', locale)}
            </div>
            {phase.html === null ? (
              <div style={{ color: color.ink2, padding: space.s4 }}>{ts('preparingReceipt', locale)}</div>
            ) : (
              <iframe
                ref={iframeRef}
                title="receipt"
                srcDoc={phase.html}
                style={{ width: '100%', height: 380, border: `1px solid ${color.line}`, borderRadius: radius.sm, background: color.white }}
              />
            )}
            <div style={{ display: 'flex', gap: space.s2, marginTop: space.s3 }}>
              <Button
                variant="secondary"
                pos
                style={{ flex: 1 }}
                disabled={phase.html === null}
                onClick={() => {
                  iframeRef.current?.contentWindow?.focus();
                  iframeRef.current?.contentWindow?.print();
                }}
              >
                {ts('print', locale)}
              </Button>
              <Button pos style={{ flex: 1 }} onClick={props.onNewSale}>{ts('newSale', locale)}</Button>
            </div>
          </>
        )}

        {phase.step === 'error' && (
          <>
            <div style={{ color: color.red, fontWeight: fontWeight.bold, marginBottom: space.s2 }}>
              {ts('error', locale)}
            </div>
            <div style={{ color: color.ink2, marginBottom: space.s3 }}>{phase.message}</div>
            <div style={{ display: 'flex', gap: space.s2 }}>
              <Button variant="secondary" pos style={{ flex: 1 }} onClick={props.onBackToForm}>← {ts('pay', locale)}</Button>
              <Button pos style={{ flex: 1 }} onClick={props.onNewSale}>{ts('newSale', locale)}</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
