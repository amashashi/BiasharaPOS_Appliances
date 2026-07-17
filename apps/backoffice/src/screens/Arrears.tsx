import { useEffect, useState } from 'react';
import {
  Button, MoneyDisplay, arrearsStyle, color, font, fontSize, fontWeight, radius, space, type Locale,
} from '@biashara/ui';
import { fetchArrears, type ArrearsRow, type Session } from '../api.js';

const S = {
  daysOverdue: { sw: 'Siku za ucheleweshaji', en: 'Days overdue' },
  amount: { sw: 'Kiasi', en: 'Amount' },
  arrears: { sw: 'Madeni yaliyochelewa', en: 'Arrears' },
  customer: { sw: 'Mteja', en: 'Customer' },
  order: { sw: 'Oda', en: 'Order' },
  type: { sw: 'Aina', en: 'Type' },
  balance: { sw: 'Salio la mkataba', en: 'Schedule balance' },
  nextDue: { sw: 'Malipo yajayo', en: 'Next due' },
  asOf: { sw: 'Kufikia tarehe', en: 'As of' },
  sortBy: { sw: 'Panga kwa', en: 'Sort by' },
  none: { sw: 'Hakuna mteja aliyechelewa 🎉', en: 'No one is behind on payments 🎉' },
  totalOwed: { sw: 'Jumla ya madeni', en: 'Total arrears' },
  agreements: { sw: 'mikataba', en: 'agreements' },
  signOut: { sw: 'Toka', en: 'Sign out' },
} as const;
const t = (k: keyof typeof S, l: Locale): string => S[k][l];

const cell: React.CSSProperties = {
  padding: `${space.s2}px ${space.s3}px`,
  textAlign: 'left',
  fontSize: fontSize.body,
  borderBottom: `1px solid ${color.line}`,
};

export function Arrears({
  session, locale, onLocale, onSignOut,
}: {
  session: Session;
  locale: Locale;
  onLocale: (l: Locale) => void;
  onSignOut: () => void;
}) {
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
    <main style={{ fontFamily: font.sans, minHeight: '100vh', background: color.bg, color: color.ink }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: space.s3, padding: `${space.s2}px ${space.s4}px`, background: color.surface, borderBottom: `1px solid ${color.line}` }}>
        <img src="/logo-icon.svg" alt="" style={{ width: 32, height: 32 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: fontWeight.bold }}>{session.merchant.name}</div>
          <div style={{ fontSize: fontSize.sm, color: color.ink3 }}>{t('arrears', locale)} · {session.displayName}</div>
        </div>
        <Button variant="ghost" onClick={() => onLocale(locale === 'sw' ? 'en' : 'sw')}>
          {locale === 'sw' ? 'English' : 'Kiswahili'}
        </Button>
        <Button variant="ghost" onClick={onSignOut}>{t('signOut', locale)}</Button>
      </header>

      <div style={{ padding: space.s4, maxWidth: 980, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: space.s4, marginBottom: space.s4, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: space.s1, fontSize: fontSize.sm, color: color.ink2 }}>
            {t('asOf', locale)}
            <input
              type="date"
              value={asOf}
              onChange={(e) => setAsOf(e.target.value)}
              style={{ minHeight: 40, padding: `${space.s1}px ${space.s2}px`, fontFamily: font.sans, fontSize: fontSize.body, border: `1px solid ${color.line2}`, borderRadius: radius.sm }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: space.s1, fontSize: fontSize.sm, color: color.ink2 }}>
            {t('sortBy', locale)}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as 'days' | 'amount')}
              style={{ minHeight: 40, padding: `${space.s1}px ${space.s2}px`, fontFamily: font.sans, fontSize: fontSize.body, border: `1px solid ${color.line2}`, borderRadius: radius.sm }}
            >
              <option value="days">{t('daysOverdue', locale)}</option>
              <option value="amount">{t('amount', locale)}</option>
            </select>
          </label>
          {data && (
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: fontSize.sm, color: color.ink3 }}>{t('totalOwed', locale)}</div>
              <MoneyDisplay amountTzs={data.totals.arrearsTzs} variant="negative" size={22} />
              <div style={{ fontSize: fontSize.sm, color: color.ink3 }}>{data.totals.agreements} {t('agreements', locale)}</div>
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
                  <th style={{ ...cell, fontWeight: fontWeight.semibold }}>{t('customer', locale)}</th>
                  <th style={{ ...cell, fontWeight: fontWeight.semibold }}>{t('order', locale)}</th>
                  <th style={{ ...cell, fontWeight: fontWeight.semibold, textAlign: 'right' }}>{t('daysOverdue', locale)}</th>
                  <th style={{ ...cell, fontWeight: fontWeight.semibold, textAlign: 'right' }}>{t('arrears', locale)}</th>
                  <th style={{ ...cell, fontWeight: fontWeight.semibold, textAlign: 'right' }}>{t('balance', locale)}</th>
                  <th style={{ ...cell, fontWeight: fontWeight.semibold }}>{t('nextDue', locale)}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((row: ArrearsRow) => {
                  const badge = arrearsStyle(row.daysOverdue);
                  return (
                    <tr key={row.agreementId}>
                      <td style={cell}>
                        <div style={{ fontWeight: fontWeight.semibold }}>{row.customer.name}</div>
                        <div style={{ fontSize: fontSize.sm, color: color.ink3 }}>{row.customer.phone ?? ''}</div>
                      </td>
                      <td style={{ ...cell, color: color.ink2 }}>
                        SO-{String(row.orderNumber).padStart(6, '0')}
                        <span style={{ marginLeft: space.s2, fontSize: fontSize.xs, color: color.ink3 }}>{row.type}</span>
                      </td>
                      <td style={{ ...cell, textAlign: 'right' }}>
                        <span style={{ display: 'inline-block', minWidth: 34, padding: `2px ${space.s2}px`, borderRadius: radius.pill, background: badge.bg, color: badge.fg, fontWeight: fontWeight.bold, fontVariantNumeric: 'tabular-nums' }}>
                          {row.daysOverdue}
                        </span>
                      </td>
                      <td style={{ ...cell, textAlign: 'right' }}><MoneyDisplay amountTzs={row.arrearsTzs} variant="negative" /></td>
                      <td style={{ ...cell, textAlign: 'right' }}><MoneyDisplay amountTzs={row.scheduleBalanceTzs} variant="muted" /></td>
                      <td style={{ ...cell, color: color.ink2 }}>{row.nextDueDate ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
