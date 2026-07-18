import { useEffect, useState } from 'react';
import {
  MoneyDisplay, StatusBadge, color, font, fontSize, fontWeight, formatDate, radius, space,
  type Locale,
} from '@biashara/ui';
import { fetchArrears, type ArrearsRow, type Session } from '../api.js';

const S = {
  daysOverdue: { sw: 'Siku za ucheleweshaji', en: 'Days overdue' },
  amount: { sw: 'Kiasi', en: 'Amount' },
  arrears: { sw: 'Madeni yaliyochelewa', en: 'Arrears' },
  customer: { sw: 'Mteja', en: 'Customer' },
  order: { sw: 'Oda', en: 'Order' },
  balance: { sw: 'Salio la mkataba', en: 'Schedule balance' },
  nextDue: { sw: 'Malipo yajayo', en: 'Next due' },
  asOf: { sw: 'Kufikia tarehe', en: 'As of' },
  sortBy: { sw: 'Panga kwa', en: 'Sort by' },
  none: { sw: 'Hakuna mteja aliyechelewa 🎉', en: 'No one is behind on payments 🎉' },
  totalOwed: { sw: 'Jumla ya madeni', en: 'Total arrears' },
  agreements: { sw: 'mikataba', en: 'agreements' },
} as const;
const t = (k: keyof typeof S, l: Locale): string => S[k][l];

const cell: React.CSSProperties = {
  padding: `${space.s2}px ${space.s3}px`,
  textAlign: 'left',
  fontSize: fontSize.body,
  borderBottom: `1px solid ${color.line}`,
};
/** §3: table headers are the eyebrow treatment — xs, 800, letterspaced caps. */
const headerCell: React.CSSProperties = {
  ...cell,
  fontSize: fontSize.xs,
  fontWeight: fontWeight.heavy,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: color.ink2,
};
const input: React.CSSProperties = {
  minHeight: 40,
  padding: `${space.s1}px ${space.s2}px`,
  fontFamily: font.sans,
  fontSize: fontSize.body,
  border: `1px solid ${color.line2}`,
  borderRadius: radius.xs,
};

/** Arrears dashboard (T3.3) — the Credit module's home inside the shell. */
export function Arrears({ session, locale }: { session: Session; locale: Locale }) {
  const [asOf, setAsOf] = useState(new Date().toISOString().slice(0, 10));
  const [sort, setSort] = useState<'days' | 'amount'>('days');
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchArrears>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchArrears(session, asOf, sort)
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e: Error) => setError(e.message));
  }, [session, asOf, sort]);

  return (
    <div style={{ padding: space.s4, maxWidth: 980, fontFamily: font.sans }}>
      <h2 style={{ margin: `0 0 ${space.s3}px`, fontSize: fontSize.h3, fontWeight: fontWeight.heavy, letterSpacing: '-0.01em' }}>
        {t('arrears', locale)}
      </h2>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: space.s4, marginBottom: space.s4, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: space.s1, fontSize: fontSize.sm, color: color.ink2 }}>
          {t('asOf', locale)}
          <input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} style={input} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: space.s1, fontSize: fontSize.sm, color: color.ink2 }}>
          {t('sortBy', locale)}
          <select value={sort} onChange={(e) => setSort(e.target.value as 'days' | 'amount')} style={input}>
            <option value="days">{t('daysOverdue', locale)}</option>
            <option value="amount">{t('amount', locale)}</option>
          </select>
        </label>
        {data && (
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: fontSize.sm, color: color.ink3 }}>{t('totalOwed', locale)}</div>
            <MoneyDisplay amountTzs={data.totals.arrearsTzs} variant="negative" size={22} />
            <div style={{ fontSize: fontSize.sm, color: color.ink3 }}>
              {data.totals.agreements} {t('agreements', locale)}
            </div>
          </div>
        )}
      </div>

      {error && <div style={{ color: color.red, marginBottom: space.s3 }}>{error}</div>}

      {data && data.items.length === 0 && (
        <div style={{ padding: space.s6, textAlign: 'center', color: color.ink3, fontSize: fontSize.lead }}>
          {t('none', locale)}
        </div>
      )}

      {data && data.items.length > 0 && (
        <div style={{ background: color.surface, borderRadius: radius.md, border: `1px solid ${color.line}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: color.tint }}>
                <th style={headerCell}>{t('customer', locale)}</th>
                <th style={headerCell}>{t('order', locale)}</th>
                <th style={{ ...headerCell, textAlign: 'right' }}>{t('daysOverdue', locale)}</th>
                <th style={{ ...headerCell, textAlign: 'right' }}>{t('arrears', locale)}</th>
                <th style={{ ...headerCell, textAlign: 'right' }}>{t('balance', locale)}</th>
                <th style={headerCell}>{t('nextDue', locale)}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((row: ArrearsRow) => (
                <tr key={row.agreementId}>
                  <td style={cell}>
                    <div style={{ fontWeight: fontWeight.semibold }}>{row.customer.name}</div>
                    <div style={{ fontSize: fontSize.sm, color: color.ink3 }}>{row.customer.phone ?? ''}</div>
                  </td>
                  <td style={{ ...cell, color: color.ink2 }}>
                    SO-{String(row.orderNumber).padStart(6, '0')}
                    <span style={{ marginLeft: space.s2, fontSize: fontSize.xs, color: color.steel, fontWeight: fontWeight.semibold, letterSpacing: '0.06em' }}>
                      {row.type}
                    </span>
                  </td>
                  <td style={{ ...cell, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <StatusBadge kind="arrears" daysOverdue={row.daysOverdue} locale={locale} />
                  </td>
                  <td style={{ ...cell, textAlign: 'right' }}>
                    <MoneyDisplay amountTzs={row.arrearsTzs} variant="negative" />
                  </td>
                  <td style={{ ...cell, textAlign: 'right' }}>
                    <MoneyDisplay amountTzs={row.scheduleBalanceTzs} variant="muted" />
                  </td>
                  <td style={{ ...cell, color: color.ink2 }}>{row.nextDueDate ? formatDate(row.nextDueDate) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
