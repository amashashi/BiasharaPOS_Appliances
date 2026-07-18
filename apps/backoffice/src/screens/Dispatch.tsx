import { useEffect, useState } from 'react';
import {
  Button, color, font, fontSize, fontWeight, radius, space, type Locale,
} from '@biashara/ui';
import {
  confirmDelivery, failDelivery, fetchDispatch, markDispatched,
  type DispatchJob, type Session,
} from '../api.js';

const S = {
  dispatch: { sw: 'Safari za leo', en: "Today's deliveries" },
  date: { sw: 'Tarehe', en: 'Date' },
  none: { sw: 'Hakuna safari kwa siku hii', en: 'No deliveries for this day' },
  markDispatched: { sw: 'Nimeondoka nayo', en: 'Mark dispatched' },
  dispatched: { sw: 'Imeondoka', en: 'Dispatched' },
  planned: { sw: 'Imepangwa', en: 'Planned' },
  call: { sw: 'Piga simu', en: 'Call' },
  items: { sw: 'Bidhaa', en: 'Items' },
  window: { sw: 'Muda', en: 'Window' },
  delivered: { sw: 'Imefikishwa', en: 'Delivered' },
  failed: { sw: 'Imeshindikana', en: 'Failed' },
  confirmSerials: { sw: 'Thibitisha namba (skani)', en: 'Confirm serials (scan)' },
  receivedBy: { sw: 'Amepokea (jina)', en: 'Received by (name)' },
  confirm: { sw: 'Thibitisha kufikishwa', en: 'Confirm delivery' },
  reason: { sw: 'Sababu ya kushindikana', en: 'Reason it failed' },
  confirmFail: { sw: 'Thibitisha kushindikana', en: 'Confirm failure' },
  cancel: { sw: 'Ghairi', en: 'Cancel' },
} as const;
const t = (k: keyof typeof S, l: Locale): string => S[k][l];

const fieldStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 44,
  padding: `${space.s2}px ${space.s3}px`,
  fontFamily: font.sans,
  fontSize: fontSize.body,
  border: `1px solid ${color.line2}`,
  borderRadius: radius.sm,
  boxSizing: 'border-box',
};

const statusPill = (status: DispatchJob['status']): React.CSSProperties => ({
  display: 'inline-block',
  padding: `${space.s1}px ${space.s2}px`,
  borderRadius: radius.xs,
  fontSize: fontSize.xs,
  fontWeight: fontWeight.heavy,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  ...(status === 'DISPATCHED'
    ? { background: color.green50, color: color.greenD }
    : { background: color.steelTint, color: color.steel }),
});

/** Mobile-friendly dispatch list for delivery staff (T4.2). Card layout, big touch targets. */
export function Dispatch({ session, locale }: { session: Session; locale: Locale }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [jobs, setJobs] = useState<DispatchJob[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = (): void => {
    fetchDispatch(session, date)
      .then((r) => {
        setJobs(r.jobs);
        setError(null);
      })
      .catch((e: Error) => setError(e.message));
  };
  useEffect(load, [session, date]);

  const dispatch = async (id: string): Promise<void> => {
    setBusyId(id);
    try {
      await markDispatched(session, id);
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const confirm = async (
    id: string,
    body: { serials: string[]; signedByName?: string; otpConfirmed?: boolean },
  ): Promise<void> => {
    setBusyId(id);
    try {
      await confirmDelivery(session, id, body);
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const fail = async (id: string, reason: string): Promise<void> => {
    setBusyId(id);
    try {
      await failDelivery(session, id, reason);
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div style={{ padding: space.s4, maxWidth: 620, margin: '0 auto', fontFamily: font.sans }}>
      <h2 style={{ margin: `0 0 ${space.s3}px`, fontSize: fontSize.h3, fontWeight: fontWeight.heavy, letterSpacing: '-0.01em' }}>
        {t('dispatch', locale)}
      </h2>
      <label style={{ display: 'flex', flexDirection: 'column', gap: space.s1, fontSize: fontSize.sm, color: color.ink2, marginBottom: space.s4, maxWidth: 220 }}>
        {t('date', locale)}
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ minHeight: 44, padding: `${space.s1}px ${space.s2}px`, fontFamily: font.sans, fontSize: fontSize.body, border: `1px solid ${color.line2}`, borderRadius: radius.sm }}
        />
      </label>

      {error && <div style={{ color: color.red, marginBottom: space.s3 }}>{error}</div>}
      {jobs && jobs.length === 0 && (
        <div style={{ padding: space.s6, textAlign: 'center', color: color.ink3, fontSize: fontSize.lead }}>
          {t('none', locale)} 🚚
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: space.s3 }}>
        {(jobs ?? []).map((job) => (
          <div key={job.id} style={{ background: color.surface, border: `1px solid ${color.line}`, borderRadius: radius.md, padding: space.s4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: space.s2, marginBottom: space.s2 }}>
              <span style={{ fontWeight: fontWeight.bold, fontSize: fontSize.bodyLg }}>{job.order.numberFormatted}</span>
              <span style={statusPill(job.status)}>{job.status === 'DISPATCHED' ? t('dispatched', locale) : t('planned', locale)}</span>
            </div>

            <div style={{ fontWeight: fontWeight.semibold }}>{job.customer?.name ?? '—'}</div>
            <div style={{ color: color.ink2, fontSize: fontSize.body, margin: `${space.s1}px 0` }}>{job.addressText}</div>
            {job.window && (
              <div style={{ color: color.ink3, fontSize: fontSize.sm }}>
                {t('window', locale)}: {job.window}
              </div>
            )}

            <div style={{ margin: `${space.s2}px 0`, paddingTop: space.s2, borderTop: `1px dashed ${color.line}` }}>
              <div style={{ fontSize: fontSize.xs, fontWeight: fontWeight.heavy, letterSpacing: '0.08em', textTransform: 'uppercase', color: color.ink3, marginBottom: space.s1 }}>
                {t('items', locale)}
              </div>
              {job.lines.map((l, i) => (
                <div key={i} style={{ fontSize: fontSize.body }}>
                  {l.qty}× {l.description}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: space.s2, marginTop: space.s3 }}>
              {job.customer?.phone && (
                <a
                  href={`tel:${job.customer.phone}`}
                  style={{ flex: 1, minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: space.s1, textDecoration: 'none', borderRadius: radius.sm, border: `1px solid ${color.line2}`, color: color.blueD, fontWeight: fontWeight.semibold, fontSize: fontSize.bodyLg }}
                >
                  📞 {t('call', locale)}
                </a>
              )}
              {job.status === 'PLANNED' && (
                <Button pos style={{ flex: 2 }} loading={busyId === job.id} onClick={() => void dispatch(job.id)}>
                  {t('markDispatched', locale)}
                </Button>
              )}
            </div>

            {job.status === 'DISPATCHED' && (
              <JobActions
                job={job}
                locale={locale}
                busy={busyId === job.id}
                onConfirm={(body) => confirm(job.id, body)}
                onFail={(reason) => fail(job.id, reason)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Inline handover form for a DISPATCHED job: confirm serials + receiver, or fail with a reason. */
function JobActions({
  job, locale, busy, onConfirm, onFail,
}: {
  job: DispatchJob;
  locale: Locale;
  busy: boolean;
  onConfirm: (body: { serials: string[]; signedByName?: string; otpConfirmed?: boolean }) => void;
  onFail: (reason: string) => void;
}) {
  const [mode, setMode] = useState<'none' | 'deliver' | 'fail'>('none');
  const [signedBy, setSignedBy] = useState('');
  const [reason, setReason] = useState('');

  if (mode === 'none') {
    return (
      <div style={{ display: 'flex', gap: space.s2, marginTop: space.s2 }}>
        <Button pos variant="danger" style={{ flex: 1 }} onClick={() => setMode('fail')}>
          ✗ {t('failed', locale)}
        </Button>
        <Button pos style={{ flex: 2 }} onClick={() => setMode('deliver')}>
          ✓ {t('delivered', locale)}
        </Button>
      </div>
    );
  }

  if (mode === 'deliver') {
    return (
      <div style={{ marginTop: space.s3, paddingTop: space.s3, borderTop: `1px dashed ${color.line}` }}>
        {job.serials.length > 0 && (
          <>
            <div style={{ fontSize: fontSize.xs, fontWeight: fontWeight.heavy, letterSpacing: '0.08em', textTransform: 'uppercase', color: color.ink3, marginBottom: space.s1 }}>
              {t('confirmSerials', locale)}
            </div>
            {job.serials.map((s) => (
              <div key={s} style={{ fontFamily: font.mono, fontSize: fontSize.body, color: color.steel }}>✓ {s}</div>
            ))}
          </>
        )}
        <input
          style={{ ...fieldStyle, margin: `${space.s2}px 0` }}
          placeholder={t('receivedBy', locale)}
          value={signedBy}
          onChange={(e) => setSignedBy(e.target.value)}
        />
        <div style={{ display: 'flex', gap: space.s2 }}>
          <Button variant="secondary" pos style={{ flex: 1 }} onClick={() => setMode('none')}>
            {t('cancel', locale)}
          </Button>
          <Button
            pos
            style={{ flex: 2 }}
            loading={busy}
            disabled={!signedBy.trim()}
            onClick={() => onConfirm({ serials: job.serials, signedByName: signedBy.trim(), otpConfirmed: true })}
          >
            {t('confirm', locale)}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: space.s3, paddingTop: space.s3, borderTop: `1px dashed ${color.line}` }}>
      <input
        style={{ ...fieldStyle, marginBottom: space.s2 }}
        placeholder={t('reason', locale)}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <div style={{ display: 'flex', gap: space.s2 }}>
        <Button variant="secondary" pos style={{ flex: 1 }} onClick={() => setMode('none')}>
          {t('cancel', locale)}
        </Button>
        <Button
          variant="danger"
          pos
          style={{ flex: 2 }}
          loading={busy}
          disabled={!reason.trim()}
          onClick={() => onFail(reason.trim())}
        >
          {t('confirmFail', locale)}
        </Button>
      </div>
    </div>
  );
}
