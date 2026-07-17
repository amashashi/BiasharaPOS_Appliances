/**
 * Back-office home (T3.3): dev sign-in (D-028) → arrears dashboard. The full
 * dashboard suite + design Showcase land as tabs in M6 (T6.1); for now the
 * arrears screen is the home, since the credit notebook is M3's payload.
 */
import { useState } from 'react';
import type { Locale } from '@biashara/ui';
import { loadSession, saveSession, type Session } from './api.js';
import { DevLogin } from './screens/DevLogin.js';
import { Arrears } from './screens/Arrears.js';

export function App(): JSX.Element {
  const [session, setSession] = useState<Session | null>(loadSession());
  const [locale, setLocale] = useState<Locale>('sw');

  if (!session) {
    return (
      <DevLogin
        onSignIn={(s) => {
          saveSession(s);
          setSession(s);
        }}
      />
    );
  }
  return (
    <Arrears
      session={session}
      locale={locale}
      onLocale={setLocale}
      onSignOut={() => {
        saveSession(null);
        setSession(null);
      }}
    />
  );
}
