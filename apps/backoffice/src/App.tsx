/**
 * Back office (T3.3+): platform sign-in (T5.1, D-034) → app shell with sidebar
 * navigation (handoff navStyle "sidebar"). Modules fill in one by one; see Shell.tsx.
 */
import { useEffect, useState } from 'react';
import { usePersistedLocale } from '@biashara/ui';
import { loadSession, saveSession, SESSION_EVENT, type Session } from './api.js';
import { Login } from './screens/Login.js';
import { Shell } from './Shell.js';

export function App(): JSX.Element {
  const [session, setSession] = useState<Session | null>(loadSession());
  const [locale, setLocale] = usePersistedLocale(); // default 'en'; survives refresh

  // token refresh / forced sign-out happens inside api.ts — mirror it into state
  useEffect(() => {
    const sync = (): void => setSession(loadSession());
    window.addEventListener(SESSION_EVENT, sync);
    return () => window.removeEventListener(SESSION_EVENT, sync);
  }, []);

  if (!session) {
    return (
      <Login
        locale={locale}
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
