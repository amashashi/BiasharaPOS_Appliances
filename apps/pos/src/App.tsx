/**
 * POS checkout (T2.6): dev sign-in (stub era, D-028) → search/cart/customer →
 * cash or mobile-money payment → fiscal receipt print view. Tokens only.
 */
import { useState } from 'react';
import type { Locale } from '@biashara/ui';
import { loadSession, saveSession, type Session } from './api.js';
import { DevLogin } from './screens/DevLogin.js';
import { Checkout } from './screens/Checkout.js';

export function App(): JSX.Element {
  const [session, setSession] = useState<Session | null>(loadSession());
  const [locale, setLocale] = useState<Locale>('sw');

  if (!session) {
    return (
      <DevLogin
        locale={locale}
        onSignIn={(s) => {
          saveSession(s);
          setSession(s);
        }}
      />
    );
  }
  return (
    <Checkout
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
