import { useState } from 'react';
import { Button, color, font, fontSize, radius, space, type Locale } from '@biashara/ui';
import { login, type Session } from '../api.js';

const S = {
  title: { sw: 'Ofisi ya nyuma', en: 'Back office' },
  phone: { sw: 'Namba ya simu', en: 'Phone number' },
  pin: { sw: 'PIN (tarakimu 4)', en: 'PIN (4 digits)' },
  signIn: { sw: 'Ingia', en: 'Sign in' },
} as const;
const t = (k: keyof typeof S, l: Locale): string => S[k][l];

const field: React.CSSProperties = {
  width: '100%',
  minHeight: 44,
  padding: `${space.s2}px ${space.s3}px`,
  fontFamily: font.sans,
  fontSize: fontSize.body,
  border: `1px solid ${color.line2}`,
  borderRadius: radius.sm,
  boxSizing: 'border-box',
};

/** Real platform sign-in (T5.1, D-034): phone + PIN, verified by the BiasharaPOS platform. */
export function Login({ locale, onSignIn }: { locale: Locale; onSignIn: (s: Session) => void }) {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (): Promise<void> => {
    if (!phone.trim() || !pin.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await login(phone.trim(), pin.trim());
      onSignIn({
        token: res.token,
        refreshToken: res.refreshToken,
        merchant: res.merchant,
        displayName: res.displayName,
        role: res.role,
      });
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <main style={{ fontFamily: font.sans, minHeight: '100vh', display: 'grid', placeItems: 'center', background: color.bg, color: color.ink }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        style={{ width: 360, maxWidth: '92vw', background: color.surface, borderRadius: radius.md, padding: space.s5, border: `1px solid ${color.line}` }}
      >
        <img src="/logo-lockup.svg" alt="BiasharaPOS Appliances & Electronics" style={{ width: 260, display: 'block', margin: `0 auto ${space.s4}px` }} />
        <div style={{ textAlign: 'center', color: color.ink3, fontSize: fontSize.body, marginBottom: space.s3 }}>
          {t('title', locale)}
        </div>
        {error && <div style={{ color: color.red, fontSize: fontSize.body, marginBottom: space.s2 }}>{error}</div>}
        <label style={{ display: 'block', margin: `${space.s2}px 0 ${space.s1}px`, color: color.ink2, fontSize: fontSize.sm }}>
          {t('phone', locale)}
        </label>
        <input
          style={field}
          type="tel"
          autoComplete="tel"
          placeholder="0712 000 000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <label style={{ display: 'block', margin: `${space.s3}px 0 ${space.s1}px`, color: color.ink2, fontSize: fontSize.sm }}>
          {t('pin', locale)}
        </label>
        <input
          style={field}
          type="password"
          inputMode="numeric"
          maxLength={4}
          autoComplete="current-password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        />
        <Button type="submit" style={{ width: '100%', marginTop: space.s4 }} loading={busy} disabled={!phone.trim() || pin.trim().length !== 4}>
          {t('signIn', locale)}
        </Button>
      </form>
    </main>
  );
}
