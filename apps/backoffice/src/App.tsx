/**
 * Back office (T3.3+): dev sign-in (D-028) → app shell with sidebar navigation
 * (handoff navStyle "sidebar"). Modules fill in one by one; see Shell.tsx.
 */
import { useState } from 'react';
import type { Locale } from '@biashara/ui';
import { loadSession, saveSession, type Session } from './api.js';
import { DevLogin } from './screens/DevLogin.js';
import { Shell } from './Shell.js';

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
    <Shell
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
