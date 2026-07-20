/** Back-office API client (T3.3). Real platform sign-in since T5.1 (D-034). */

export interface Session {
  token: string;
  refreshToken?: string;
  merchant: { id: string; name: string };
  displayName: string;
  role: string;
}

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000/api';
const SESSION_KEY = 'backoffice-session-v1';
/** Fired whenever the stored session changes outside React (refresh/sign-out). */
export const SESSION_EVENT = 'biashara-session';

export const loadSession = (): Session | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
};
export const saveSession = (s: Session | null): void => {
  if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  else localStorage.removeItem(SESSION_KEY);
};

/**
 * Platform access tokens live 15 min; on a 401 we refresh ONCE and retry.
 * Single-flight: concurrent 401s share one refresh — the platform ROTATES
 * refresh tokens, so a second parallel refresh with the old token would be
 * rejected and sign the user out.
 */
let refreshing: Promise<Session | null> | null = null;
const tryRefresh = (): Promise<Session | null> => {
  refreshing ??= (async () => {
    const current = loadSession();
    if (!current?.refreshToken) return null;
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken: current.refreshToken }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const pair = (await res.json()) as { token: string; refreshToken: string };
      const next = { ...current, token: pair.token, refreshToken: pair.refreshToken };
      saveSession(next);
      window.dispatchEvent(new Event(SESSION_EVENT));
      return next;
    } catch {
      saveSession(null); // refresh dead → sign out
      window.dispatchEvent(new Event(SESSION_EVENT));
      return null;
    }
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
};

async function call<T>(
  path: string,
  opts: { method?: string; body?: unknown; token?: string } = {},
  retried = false,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method ?? 'GET',
    headers: {
      ...(opts.body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  if (res.status === 401 && opts.token && !retried) {
    const next = await tryRefresh();
    if (next) return call<T>(path, { ...opts, token: next.token }, true);
  }
  if (!res.ok) {
    let message = `${res.status}`;
    try {
      const body = (await res.json()) as { message?: string };
      message = body.message ?? message;
    } catch {
      /* non-JSON */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

/** Phone + PIN sign-in against the real platform (T5.1). */
export const login = (phone: string, pin: string) =>
  call<{
    token: string;
    refreshToken: string;
    merchant: { id: string; name: string };
    displayName: string;
    role: string;
    locations: Array<{ id: string; name: string }>;
  }>('/auth/login', { method: 'POST', body: { phone, pin } });

export interface DispatchJob {
  id: string;
  status: 'PLANNED' | 'DISPATCHED';
  scheduledDate: string;
  window: string | null;
  addressText: string;
  note: string | null;
  assigneeUserId: string | null;
  order: { id: string; number: number; numberFormatted: string };
  customer: { name: string; phone: string | null } | null;
  lines: Array<{ description: string; qty: number }>;
  serials: string[];
}

export const fetchDispatch = (s: Session, date: string) =>
  call<{ date: string; jobs: DispatchJob[] }>(`/deliveries/dispatch?date=${date}`, { token: s.token });

export const markDispatched = (s: Session, deliveryId: string) =>
  call<{ id: string; status: string }>(`/deliveries/${deliveryId}/dispatch`, {
    method: 'POST',
    token: s.token,
  });

export const confirmDelivery = (
  s: Session,
  deliveryId: string,
  body: { serials: string[]; signedByName?: string; otpConfirmed?: boolean },
) =>
  call<{ id: string; status: string }>(`/deliveries/${deliveryId}/confirm`, {
    method: 'POST',
    body,
    token: s.token,
  });

export const failDelivery = (s: Session, deliveryId: string, reason: string) =>
  call<{ id: string; status: string }>(`/deliveries/${deliveryId}/fail`, {
    method: 'POST',
    body: { reason },
    token: s.token,
  });

export interface ArrearsRow {
  agreementId: string;
  orderId: string;
  orderNumber: number;
  type: string;
  customer: { id: string; name: string; phone: string | null };
  arrearsTzs: number;
  overdueRows: number;
  oldestDueDate: string;
  daysOverdue: number;
  nextDueDate: string | null;
  scheduleBalanceTzs: number;
}

export const fetchArrears = (s: Session, asOf: string, sort: 'days' | 'amount') =>
  call<{ asOf: string; items: ArrearsRow[]; totals: { agreements: number; arrearsTzs: number } }>(
    `/credit/arrears?asOf=${asOf}&sort=${sort}`,
    { token: s.token },
  );

export interface ScheduleRowView {
  seq: number;
  dueDate: string;
  amountTzs: number;
  paidTzs: number;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
}

export interface ReminderView {
  id: string;
  offsetDays: number;
  dueDate: string;
  msisdn: string;
  templateKey: string;
  amountTzs: number;
  status: 'PENDING' | 'SENT' | 'FAILED';
  error: string | null;
  sentAt: string;
}

export interface AgreementDetail {
  id: string;
  type: string;
  status: string;
  principalTzs: number;
  depositTzs: number;
  financedTzs: number;
  customer: { name: string; phone: string | null };
  schedule: ScheduleRowView[];
  reminders: ReminderView[];
  createdAt: string;
  settledAt: string | null;
}

export const fetchAgreement = (s: Session, orderId: string) =>
  call<AgreementDetail>(`/orders/${orderId}/credit-agreement`, { token: s.token });

// ── reconciliation (T5.3a) ──
export interface ReconciliationRow {
  id: string;
  reason: 'UNMATCHED' | 'UNAPPLIED_BALANCE';
  status: string;
  provider: string | null;
  providerRef: string | null;
  amountTzs: number | null;
  intentRef: string;
  receivedAt: string;
  order: { id: string; numberFormatted: string } | null;
}

export const fetchReconciliation = (s: Session) =>
  call<{ items: ReconciliationRow[]; totalTzs: number }>('/reconciliation', { token: s.token });

export const resolveReconciliation = (s: Session, id: string, note: string) =>
  call<{ id: string; resolvedAt: string }>(`/reconciliation/${id}/resolve`, {
    method: 'POST',
    body: { note },
    token: s.token,
  });

// ── offline sync exceptions (T5.6) ──
export interface SyncExceptionRow {
  id: string;
  kind: 'SERIAL_CONFLICT' | 'STALE_PRICE';
  detail: {
    productId?: string;
    lineId?: string;
    serial?: string;
    foundStatus?: string;
    offeredTzs?: number;
    catalogTzs?: number;
  };
  createdAt: string;
  order: { id: string; numberFormatted: string } | null;
}

export const fetchExceptions = (s: Session) =>
  call<{ items: SyncExceptionRow[] }>('/sync/exceptions', { token: s.token });

export const resolveException = (
  s: Session,
  id: string,
  body: { action: 'reassign' | 'accept' | 'acknowledge'; serial?: string; note?: string },
) =>
  call<{ id: string; status: string }>(`/sync/exceptions/${id}/resolve`, {
    method: 'POST',
    body,
    token: s.token,
  });

// ── fiscal aging alert (T5.7) ──
export interface FiscalAging {
  windowHours: number;
  count: number;
  oldestAgeHours: number;
  items: Array<{ paymentId: string; orderId: string; orderNumber: string; amountTzs: number; occurredAt: string; ageHours: number }>;
}

export const fetchFiscalAging = (s: Session) =>
  call<FiscalAging>('/fiscal/aging', { token: s.token });

// ── dashboard (T6.1) ──
export interface DashboardOverview {
  date: string;
  dailySales: { totalTzs: number; count: number; byMethod: Array<{ method: string; count: number; totalTzs: number }> };
  stock: {
    serialized: { inStock: number; byStatus: Record<string, number>; aging: { fresh: number; aging: number; stale: number }; valueTzs: number };
    nonSerializedQty: number;
  };
  arrears: { agreements: number; arrearsTzs: number };
  deliveries: { planned: number; dispatched: number; delivered: number; failed: number };
}

export const fetchDashboard = (s: Session, date: string) =>
  call<DashboardOverview>(`/dashboard?date=${date}`, { token: s.token });
