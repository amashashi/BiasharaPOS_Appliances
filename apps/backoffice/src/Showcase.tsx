import { useState } from 'react';
import {
  Button,
  MoneyDisplay,
  OfflineBar,
  SerialChip,
  StatusBadge,
  brand,
  color,
  font,
  fontSize,
  fontWeight,
  radius,
  shadow,
  space,
  receiptHeaderHtml,
  type Locale,
} from '@biashara/ui';

const swatches = [
  ['blue', color.blue],
  ['green', color.green],
  ['gold', color.gold],
  ['steel (sub-brand)', color.steel],
  ['ink', color.ink],
  ['red', color.red],
  ['amber', color.amber],
] as const;

/** T0.6 verification page: all tokens & core components, bilingual toggle. */
export function Showcase() {
  const [locale, setLocale] = useState<Locale>('sw');
  const card = {
    background: color.surface,
    borderRadius: radius.md,
    boxShadow: shadow.sm,
    padding: space.s4,
    marginBottom: space.s4,
  };
  const h = { fontSize: fontSize.h3, fontWeight: fontWeight.heavy, color: color.ink, margin: `0 0 ${space.s3}px` };
  return (
    <main style={{ fontFamily: font.sans, background: color.bg, minHeight: '100vh', padding: space.s6 }}>
      <OfflineBar queued={3} locale={locale} />
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.s6 }}>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: space.s3, fontSize: fontSize.h2, fontWeight: fontWeight.heavy, color: color.ink, margin: 0 }}>
            <img src="/logo-icon.svg" alt="" width={40} height={40} />
            <span>
              Biashara<span style={{ color: brand.secondary }}>POS</span>{' '}
              <span style={{ fontSize: fontSize.sm, color: brand.subBrand, letterSpacing: '0.2em' }}>UI SHOWCASE</span>
            </span>
          </h1>
          <Button variant="secondary" onClick={() => setLocale(locale === 'sw' ? 'en' : 'sw')}>
            {locale === 'sw' ? 'Switch to English' : 'Badili kwenda Kiswahili'}
          </Button>
        </header>

        <section style={card}>
          <h2 style={h}>Palette</h2>
          <div style={{ display: 'flex', gap: space.s2, flexWrap: 'wrap' }}>
            {swatches.map(([name, hex]) => (
              <div key={name} style={{ textAlign: 'center', fontSize: fontSize.xs, color: color.ink2 }}>
                <div style={{ width: 56, height: 40, background: hex, borderRadius: radius.xs, marginBottom: space.s1 }} />
                {name}
              </div>
            ))}
          </div>
        </section>

        <section style={card}>
          <h2 style={h}>Buttons</h2>
          <div style={{ display: 'flex', gap: space.s3, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button>{locale === 'sw' ? 'Kamilisha mauzo' : 'Complete sale'}</Button>
            <Button variant="secondary">{locale === 'sw' ? 'Hifadhi nakala' : 'Save draft'}</Button>
            <Button variant="danger">{locale === 'sw' ? 'Futa' : 'Delete'}</Button>
            <Button pos>{locale === 'sw' ? 'Lipa sasa (POS ≥48px)' : 'Pay now (POS ≥48px)'}</Button>
          </div>
        </section>

        <section style={card}>
          <h2 style={h}>Money — tabular TZS</h2>
          <div style={{ display: 'grid', gap: space.s1, justifyItems: 'end', width: 220 }}>
            <MoneyDisplay amountTzs={1_250_000} />
            <MoneyDisplay amountTzs={85_000} variant="positive" />
            <MoneyDisplay amountTzs={432_500} variant="negative" />
            <MoneyDisplay amountTzs={9_999_999} variant="muted" />
          </div>
        </section>

        <section style={card}>
          <h2 style={h}>Status vocabulary</h2>
          <div style={{ display: 'flex', gap: space.s2, flexWrap: 'wrap' }}>
            {(['IN_STOCK', 'RESERVED', 'SOLD', 'DELIVERED', 'RETURNED'] as const).map((s) => (
              <StatusBadge key={s} kind="unit" value={s} locale={locale} />
            ))}
            <StatusBadge kind="arrears" daysOverdue={5} locale={locale} />
            <StatusBadge kind="arrears" daysOverdue={15} locale={locale} />
            <StatusBadge kind="arrears" daysOverdue={45} locale={locale} />
          </div>
        </section>

        <section style={card}>
          <h2 style={h}>Receipt header (80mm)</h2>
          <div
            style={{ width: 302, border: `1px solid ${color.line}`, padding: space.s3, background: color.surface }}
            dangerouslySetInnerHTML={{ __html: receiptHeaderHtml({ merchantName: 'Demo Electronics Ltd', tin: '123-456-789', locationName: 'Kariakoo', phone: '+255 700 000 001' }) }}
          />
        </section>

        <section style={card}>
          <h2 style={h}>Serials</h2>
          <div style={{ display: 'flex', gap: space.s2, flexWrap: 'wrap' }}>
            <SerialChip serial="LG-2607-448812" locale={locale} />
            <SerialChip serial="SAM-RF28-90551" locale={locale} onLookup={() => {}} />
          </div>
        </section>
      </div>
    </main>
  );
}
