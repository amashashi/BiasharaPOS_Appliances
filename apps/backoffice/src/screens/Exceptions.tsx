import { useEffect, useState } from 'react';
import {
  Button, MoneyDisplay, color, font, fontSize, fontWeight, formatDateTime, radius, space, type Locale,
} from '@biashara/ui';
import { fetchExceptions, resolveException, type SyncExceptionRow, type Session } from '../api.js';

const S = {
  title: { sw: 'Migogoro ya mauzo ya nje ya mtandao', en: 'Offline sync exceptions' },
  intro: {
    sw: 'Mauzo yaliyofanywa nje ya mtandao yaligongana na hali halisi — tatua kila moja.',
    en: 'Sales made offline that clashed with live state — resolve each one.',
  },
  none: { sw: 'Hakuna migogoro 🎉', en: 'No exceptions to resolve 🎉' },
  order: { sw: 'Oda', en: 'Order' },
  serialConflict: { sw: 'Namba imekwisha uzwa', en: 'Serial already sold' },
  stalePrice: { sw: 'Bei imepitwa na wakati', en: 'Stale price' },
  soldSerial: { sw: 'Namba iliyoombwa', en: 'Claimed serial' },
  nowStatus: { sw: 'Hali sasa', en: 'Now' },
  offered: { sw: 'Bei ya mauzo', en: 'Charged offline' },
  catalog: { sw: 'Bei ya katalogi', en: 'Catalog now' },
  reassign: { sw: 'Badilisha namba', en: 'Reassign serial' },
  newSerial: { sw: 'Namba mbadala (skani)', en: 'Replacement serial (scan)' },
  confirmReassign: { sw: 'Thibitisha', en: 'Confirm' },
  acknowledge: { sw: 'Kubali (shughulikia mwenyewe)', en: 'Acknowledge (handle manually)' },
  accept: { sw: 'Kubali bei', en: 'Accept price' },
  cancel: { sw: 'Ghairi', en: 'Cancel' },
} as const;
const t = (k: keyof typeof S, l: Locale): string => S[k][l];

const pill = (danger: boolean): React.CSSProperties => ({
  display: 'inline-block',
  padding: `${space.s1}px ${space.s2}px`,
  borderRadius: radius.xs,
  fontSize: fontSize.xs,
  fontWeight: fontWeight.heavy,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  background: danger ? color.red50 : color.gold50,
  color: danger ? color.red : color.amber,
});

/** Offline-sync exception queue (T5.6): OWNER resolves serial conflicts + stale prices. */
export function Exceptions({ session, locale }: { session: Session; locale: Locale }) {
  const [items, setItems] = useState<SyncExceptionRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reassignId, setReassignId] = useState<string | null>(null);
  const [serial, setSerial] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = (): void => {
    fetchExceptions(session)
      .then((r) => { setItems(r.items); setError(null); })
      .catch((e: Error) => setError(e.message));
  };
  useEffect(load, [session]);

  const resolve = async (id: string, body: { action: 'reassign' | 'accept' | 'acknowledge'; serial?: string }): Promise<void> => {
    setBusyId(id);
    setError(null);
    try {
      await resolveException(session, id, body);
      setReassignId(null);
      setSerial('');
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div style={{ padding: space.s4, maxWidth: 820, margin: '0 auto', fontFamily: font.sans }}>
      <h2 style={{ margin: `0 0 ${space.s1}px`, fontSize: fontSize.h3, fontWeight: fontWeight.heavy, letterSpacing: '-0.01em' }}>
        {t('title', locale)}
      </h2>
      <div style={{ color: color.ink2, fontSize: fontSize.body, marginBottom: space.s4 }}>{t('intro', locale)}</div>

      {error && <div style={{ color: color.red, marginBottom: space.s3 }}>{error}</div>}
      {items && items.length === 0 && (
        <div style={{ padding: space.s6, textAlign: 'center', color: color.ink3, fontSize: fontSize.lead }}>{t('none', locale)}</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: space.s3 }}>
        {(items ?? []).map((ex) => {
          const serialConflict = ex.kind === 'SERIAL_CONFLICT';
          return (
            <div key={ex.id} style={{ background: color.surface, border: `1px solid ${color.line}`, borderRadius: radius.md, padding: space.s4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: space.s2, marginBottom: space.s2 }}>
                <span style={pill(serialConflict)}>{serialConflict ? t('serialConflict', locale) : t('stalePrice', locale)}</span>
                <span style={{ fontWeight: fontWeight.bold }}>{ex.order?.numberFormatted ?? '—'}</span>
                <span style={{ marginLeft: 'auto', color: color.ink3, fontSize: fontSize.sm }}>{formatDateTime(ex.createdAt)}</span>
              </div>

              {serialConflict ? (
                <div style={{ fontSize: fontSize.body, color: color.ink2 }}>
                  {t('soldSerial', locale)}: <span style={{ fontFamily: font.mono, color: color.ink }}>{ex.detail.serial}</span>
                  {' · '}{t('nowStatus', locale)}: <strong>{ex.detail.foundStatus}</strong>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: space.s4, fontSize: fontSize.body, color: color.ink2 }}>
                  <span>{t('offered', locale)}: <MoneyDisplay amountTzs={ex.detail.offeredTzs ?? 0} /></span>
                  <span>{t('catalog', locale)}: <MoneyDisplay amountTzs={ex.detail.catalogTzs ?? 0} /></span>
                </div>
              )}

              <div style={{ marginTop: space.s3 }}>
                {serialConflict ? (
                  reassignId === ex.id ? (
                    <div style={{ display: 'flex', gap: space.s2, flexWrap: 'wrap', alignItems: 'center' }}>
                      <input
                        autoFocus
                        placeholder={t('newSerial', locale)}
                        value={serial}
                        onChange={(e) => setSerial(e.target.value)}
                        style={{ minWidth: 220, minHeight: 40, padding: `${space.s1}px ${space.s2}px`, fontFamily: font.mono, fontSize: fontSize.body, border: `1px solid ${color.line2}`, borderRadius: radius.sm }}
                      />
                      <Button variant="secondary" onClick={() => { setReassignId(null); setSerial(''); }}>{t('cancel', locale)}</Button>
                      <Button loading={busyId === ex.id} disabled={!serial.trim()} onClick={() => void resolve(ex.id, { action: 'reassign', serial: serial.trim() })}>
                        {t('confirmReassign', locale)}
                      </Button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: space.s2 }}>
                      <Button onClick={() => { setReassignId(ex.id); setSerial(''); }}>{t('reassign', locale)}</Button>
                      <Button variant="secondary" loading={busyId === ex.id} onClick={() => void resolve(ex.id, { action: 'acknowledge' })}>
                        {t('acknowledge', locale)}
                      </Button>
                    </div>
                  )
                ) : (
                  <Button loading={busyId === ex.id} onClick={() => void resolve(ex.id, { action: 'accept' })}>{t('accept', locale)}</Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
