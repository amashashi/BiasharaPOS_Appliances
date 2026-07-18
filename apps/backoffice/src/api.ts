/** Back-office API client (T3.3). Dev sign-in (D-028) until real identity (T5.1). */

export interface Session {
  token: string;
  merchant: { id: string; name: string };
  displayName: string;
  role: string;
}

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000/api';
const SESSION_KEY = 'backoffice-session-v1';

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

async function call<T>(path: string, opts: { method?: string; body?: unknown; token?: string } = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method ?? 'GET',
    headers: {
      ...(opts.body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
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

export const devContext = () =>
  call<{ merchants: Array<{ id: string; name: string }> }>('/auth/dev/context');

export const devLogin = (merchantId: string, name: string) =>
  call<{ token: string; merchant: { id: string; name: string }; displayName: string; role: string }>(
    '/auth/dev/login',
    { method: 'POST', body: { merchantId, name, role: 'OWNER' } },
  );

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
