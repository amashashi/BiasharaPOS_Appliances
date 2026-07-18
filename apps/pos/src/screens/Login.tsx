import { useState } from 'react';
import { Button, color, font, fontSize, fontWeight, radius, space, type Locale } from '@biashara/ui';
import { login, type Session } from '../api.js';
import { ts } from '../strings.js';

const field: React.CSSProperties = {
  width: '100%',
  minHeight: 48,
  padding: `${space.s2}px ${space.s3}px`,
  fontFamily: font.sans,
  fontSize: fontSize.bodyLg,
  border: `1px solid ${color.line2}`,
  borderRadius: radius.sm,
  background: color.surface,
  boxSizing: 'border-box',
};
const label: React.CSSProperties = {
  display: 'block',
  margin: `${space.s3}px 0 ${space.s1}px`,
  color: color.ink2,
  fontSize: fontSize.body,
  fontWeight: fontWeight.semibold,
};

/**
 * Real platform sign-in (T5.1, D-034): phone + PIN. The login response carries
 * the merchant's locations — the till needs one; a single location is picked
 * automatically, several show a chooser step.
 */
export function Login({ locale, onSignIn }: { locale: Locale; onSignIn: (s: Session) => void }) {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Awaited<ReturnType<typeof login>> | null>(null);
  const [locationId, setLocationId] = useState('');

  const finish = (res: NonNullable<typeof pending>, locId: string): void => {
    const location = res.locations.find((l) => l.id === locId);
    onSignIn({
      token: res.token,
      refreshToken: res.refreshToken,
      merchant: res.merchant,
      locationId: locId,
      locationName: location?.name ?? '',
      displayName: res.displayName,
      role: res.role,
    });
  };

  const submit = async (): Promise<void> => {
    if (!phone.trim() || !pin.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await login(phone.trim(), pin.trim());
      if (res.locations.length === 0) {
        setError(ts('noLocations', locale));
        setBusy(false);
        return;
      }
      if (res.locations.length === 1) {
        finish(res, res.locations[0].id);
        return;
      }
      setPending(res); // several locations — let the cashier choose the till
      setLocationId(res.locations[0].id);
      setBusy(false);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <main
      style={{
        fontFamily: font.sans, minHeight: '100vh', display: 'grid', placeItems: 'center',
        background: color.bg, color: color.ink,
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (pending) finish(pending, locationId);
          else void submit();
        }}
        style={{ width: 360, maxWidth: '92vw', background: color.surface, borderRadius: radius.md, padding: space.s5, border: `1px solid ${color.line}` }}
      >
        <img src="/logo-lockup.svg" alt="BiasharaPOS Appliances & Electronics" style={{ width: 260, display: 'block', margin: `0 auto ${space.s4}px` }} />
        {error && (
          <div style={{ color: color.red, fontSize: fontSize.body, margin: `${space.s2}px 0` }}>{error}</div>
        )}
        {!pending ? (
          <>
            <label style={label}>{ts('phone', locale)}</label>
            <input
              style={field}
              type="tel"
              autoComplete="tel"
              placeholder="0712 000 000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <label style={label}>{ts('pin', locale)}</label>
            <input
              style={field}
              type="password"
              inputMode="numeric"
              maxLength={4}
              autoComplete="current-password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
            />
            <div style={{ marginTop: space.s4 }}>
              <Button pos type="submit" loading={busy} style={{ width: '100%' }} disabled={!phone.trim() || pin.trim().length !== 4}>
                {ts('signIn', locale)}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', color: color.ink3, fontSize: fontSize.body, marginBottom: space.s2 }}>
              {ts('chooseLocation', locale)}
            </div>
            <label style={label}>{ts('location', locale)}</label>
            <select style={field} value={locationId} onChange={(e) => setLocationId(e.target.value)}>
              {pending.locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            <div style={{ marginTop: space.s4 }}>
              <Button pos type="submit" style={{ width: '100%' }}>
                {ts('continueBtn', locale)}
              </Button>
            </div>
          </>
        )}
      </form>
    </main>
  );
}
