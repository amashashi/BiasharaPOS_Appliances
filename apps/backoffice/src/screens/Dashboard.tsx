import { useEffect, useState } from 'react';
import {
  MoneyDisplay, color, font, fontSize, fontWeight, radius, space, type Locale,
} from '@biashara/ui';
import { fetchDashboard, type DashboardOverview, type Session } from '../api.js';

const S = {
  title: { sw: 'Dashibodi', en: 'Dashboard' },
  date: { sw: 'Tarehe', en: 'Date' },
  dailySales: { sw: 'Mauzo ya siku', en: "Today's sales" },
  byMethod: { sw: 'Kwa njia', en: 'By method' },
  sales: { sw: 'mauzo', en: 'sales' },
  stock: { sw: 'Bidhaa stoo', en: 'Stock' },
  inStock: { sw: 'Zilizopo (serial)', en: 'In stock (serial)' },
  aging: { sw: 'Umri stoo', en: 'Stock aging' },
  fresh: { sw: 'Mpya (<30d)', en: 'Fresh (<30d)' },
  agingMid: { sw: 'Wastani (30–90d)', en: 'Aging (30–90d)' },
  stale: { sw: 'Kongwe (>90d)', en: 'Stale (>90d)' },
  value: { sw: 'Thamani (gharama)', en: 'Value (at cost)' },
  nonSerial: { sw: 'Bidhaa nyingine (idadi)', en: 'Non-serialized (qty)' },
  arrears: { sw: 'Madeni', en: 'Arrears' },
  agreements: { sw: 'mikataba', en: 'agreements' },
  deliveries: { sw: 'Uwasilishaji leo', en: 'Deliveries today' },
  planned: { sw: 'Imepangwa', en: 'Planned' },
  dispatched: { sw: 'Imeondoka', en: 'Dispatched' },
  delivered: { sw: 'Imefikishwa', en: 'Delivered' },
  failed: { sw: 'Imeshindikana', en: 'Failed' },
  none: { sw: 'Hakuna mauzo siku hii', en: 'No sales this day' },
} as const;
const t = (k: keyof typeof S, l: Locale): string => S[k][l];

const METHOD_LABEL: Record<string, string> = { CASH: 'Cash', MOBILE_MONEY: 'Mobile money', CARD: 'Card', BANK: 'Bank' };

const card: React.CSSProperties = {
  background: color.surface, border: `1px solid ${color.line}`, borderRadius: radius.md, padding: space.s4,
};
const cardTitle: React.CSSProperties = {
  fontSize: fontSize.xs, fontWeight: fontWeight.heavy, letterSpacing: '0.08em', textTransform: 'uppercase', color: color.ink3, marginBottom: space.s3,
};
const statRow: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: `${space.s1}px 0`, fontSize: fontSize.body,
};
const bigNum: React.CSSProperties = { fontSize: fontSize.h3, fontWeight: fontWeight.heavy, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums' };

/** Owner dashboard (T6.1): the day's sales, stock health, arrears, and deliveries. */
export function Dashboard({ session, locale }: { session: Session; locale: Locale }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard(session, date)
      .then((d) => { setData(d); setError(null); })
      .catch((e: Error) => setError(e.message));
  }, [session, date]);

  const Stat = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={statRow}><span style={{ color: color.ink2 }}>{label}</span><span style={{ fontWeight: fontWeight.semibold }}>{children}</span></div>
  );

  return (
    <div style={{ padding: space.s4, maxWidth: 980, margin: '0 auto', fontFamily: font.sans }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: space.s3, marginBottom: space.s4, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: fontSize.h3, fontWeight: fontWeight.heavy, letterSpacing: '-0.01em' }}>{t('title', locale)}</h2>
        <label style={{ display: 'flex', flexDirection: 'column', gap: space.s1, fontSize: fontSize.sm, color: color.ink2 }}>
          {t('date', locale)}
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            style={{ minHeight: 40, padding: `${space.s1}px ${space.s2}px`, fontFamily: font.sans, fontSize: fontSize.body, border: `1px solid ${color.line2}`, borderRadius: radius.sm }} />
        </label>
      </div>

      {error && <div style={{ color: color.red, marginBottom: space.s3 }}>{error}</div>}

      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: space.s3 }}>
          {/* Daily sales */}
          <div style={card}>
            <div style={cardTitle}>{t('dailySales', locale)}</div>
            <div style={{ ...bigNum, color: color.greenD }}><MoneyDisplay amountTzs={data.dailySales.totalTzs} variant="positive" size={fontSize.h3} /></div>
            <div style={{ color: color.ink3, fontSize: fontSize.sm, marginBottom: space.s2 }}>{data.dailySales.count} {t('sales', locale)}</div>
            {data.dailySales.byMethod.length === 0
              ? <div style={{ color: color.ink3, fontSize: fontSize.sm }}>{t('none', locale)}</div>
              : data.dailySales.byMethod.map((m) => (
                <Stat key={m.method} label={`${METHOD_LABEL[m.method] ?? m.method} (${m.count})`}><MoneyDisplay amountTzs={m.totalTzs} /></Stat>
              ))}
          </div>

          {/* Stock */}
          <div style={card}>
            <div style={cardTitle}>{t('stock', locale)}</div>
            <Stat label={t('inStock', locale)}><span style={bigNum}>{data.stock.serialized.inStock}</span></Stat>
            <Stat label={t('value', locale)}><MoneyDisplay amountTzs={data.stock.serialized.valueTzs} /></Stat>
            <Stat label={t('nonSerial', locale)}>{data.stock.nonSerializedQty}</Stat>
            <div style={{ ...cardTitle, marginTop: space.s3, marginBottom: space.s1 }}>{t('aging', locale)}</div>
            <Stat label={t('fresh', locale)}>{data.stock.serialized.aging.fresh}</Stat>
            <Stat label={t('agingMid', locale)}>{data.stock.serialized.aging.aging}</Stat>
            <Stat label={t('stale', locale)}><span style={{ color: data.stock.serialized.aging.stale > 0 ? color.amber : color.ink }}>{data.stock.serialized.aging.stale}</span></Stat>
          </div>

          {/* Arrears */}
          <div style={card}>
            <div style={cardTitle}>{t('arrears', locale)}</div>
            <div style={{ ...bigNum, color: data.arrears.arrearsTzs > 0 ? color.red : color.ink }}>
              <MoneyDisplay amountTzs={data.arrears.arrearsTzs} variant={data.arrears.arrearsTzs > 0 ? 'negative' : 'default'} size={fontSize.h3} />
            </div>
            <div style={{ color: color.ink3, fontSize: fontSize.sm }}>{data.arrears.agreements} {t('agreements', locale)}</div>
          </div>

          {/* Deliveries today */}
          <div style={card}>
            <div style={cardTitle}>{t('deliveries', locale)}</div>
            <Stat label={t('planned', locale)}>{data.deliveries.planned}</Stat>
            <Stat label={t('dispatched', locale)}>{data.deliveries.dispatched}</Stat>
            <Stat label={t('delivered', locale)}><span style={{ color: color.greenD }}>{data.deliveries.delivered}</span></Stat>
            <Stat label={t('failed', locale)}><span style={{ color: data.deliveries.failed > 0 ? color.red : color.ink }}>{data.deliveries.failed}</span></Stat>
          </div>
        </div>
      )}
    </div>
  );
}
