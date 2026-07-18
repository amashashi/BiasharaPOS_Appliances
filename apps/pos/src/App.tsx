/**
 * POS checkout (T2.6): platform sign-in (T5.1, D-034) → search/cart/customer →
 * cash or mobile-money payment → fiscal receipt print view. Offline cash sales
 * queue in an outbox and replay on reconnect (T5.5). Tokens only.
 */
import { useCallback, useEffect, useState } from 'react';
import { OfflineBar, usePersistedLocale } from '@biashara/ui';
import { loadSession, saveSession, syncOutbox, SESSION_EVENT, type Session } from './api.js';
import { drainOutbox, idbOutbox } from './outbox.js';
import { Login } from './screens/Login.js';
import { Checkout } from './screens/Checkout.js';

export function App(): JSX.Element {
  const [session, setSession] = useState<Session | null>(loadSession());
  const [locale, setLocale] = usePersistedLocale(); // default 'en'; survives refresh
  const [queued, setQueued] = useState(0);

  // token refresh / forced sign-out happens inside api.ts — mirror it into state
  useEffect(() => {
    const sync = (): void => setSession(loadSession());
    window.addEventListener(SESSION_EVENT, sync);
    return () => window.removeEventListener(SESSION_EVENT, sync);
  }, []);

  const refreshQueued = useCallback(() => {
    idbOutbox.count().then(setQueued).catch(() => undefined);
  }, []);

  // drain the outbox on load and whenever the network returns (T5.5). Single-flight
  // inside drainOutbox means a burst of 'online' events replays each sale once.
  const drain = useCallback(() => {
    if (!session) return;
    drainOutbox(idbOutbox, (ops) => syncOutbox(session, ops))
      .catch(() => undefined) // still offline / server down — stays queued for next time
      .finally(refreshQueued);
  }, [session, refreshQueued]);

  useEffect(() => {
    if (!session) return;
    refreshQueued();
    drain();
    window.addEventListener('online', drain);
    window.addEventListener('offline', refreshQueued);
    return () => {
      window.removeEventListener('online', drain);
      window.removeEventListener('offline', refreshQueued);
    };
  }, [session, drain, refreshQueued]);

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
    <>
      <OfflineBar queued={queued} locale={locale} />
      <Checkout
        session={session}
        locale={locale}
        onLocale={setLocale}
        onSignOut={() => {
          saveSession(null);
          setSession(null);
        }}
        onEnqueued={() => {
          refreshQueued();
          drain(); // if the failure was transient we may already be back — try immediately
        }}
      />
    </>
  );
}
