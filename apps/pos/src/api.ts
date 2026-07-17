/** POS API client (T2.6). Bearer token from the dev sign-in (D-028) until T5.1. */

export interface Session {
  token: string;
  merchant: { id: string; name: string };
  locationId: string;
  locationName: string;
  displayName: string;
  role: string;
}

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000/api';
const SESSION_KEY = 'pos-session-v1';

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

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function call<T>(
  path: string,
  opts: { method?: string; body?: unknown; token?: string } = {},
): Promise<T> {
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
      const body = (await res.json()) as { message?: string; errors?: Array<{ message: string }> };
      message = body.errors?.map((e) => e.message).join('; ') ?? body.message ?? message;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, message);
  }
  const type = res.headers.get('content-type') ?? '';
  return (type.includes('text/html') ? res.text() : res.json()) as Promise<T>;
}

// ── dev auth (stub era) ──
export const devContext = () =>
  call<{
    enabled: boolean;
    roles: string[];
    merchants: Array<{ id: string; name: string; locations: Array<{ id: string; name: string }> }>;
  }>('/auth/dev/context');

export const devLogin = (merchantId: string, name: string, role: string) =>
  call<{ token: string; merchant: { id: string; name: string }; displayName: string; role: string }>(
    '/auth/dev/login',
    { method: 'POST', body: { merchantId, name, role } },
  );

export const devResolveMm = (intentId: string, outcome: 'CONFIRMED' | 'FAILED') =>
  call('/auth/dev/mm-resolve', { method: 'POST', body: { intentId, outcome } });

// ── checkout ──
export interface ProductHit {
  id: string;
  brand: string;
  model: string;
  sku: string | null;
  category: string;
  priceTzs: number;
  isSerialized: boolean;
}

export const searchProducts = (s: Session, q: string) =>
  call<{ items: ProductHit[] }>(`/catalog/products?q=${encodeURIComponent(q)}&limit=24`, {
    token: s.token,
  });

export interface OrderPayload {
  type: 'ORDER';
  locationId: string;
  customer?: { name: string; phone?: string };
  lines: Array<{ productId: string; qty: number }>;
}

export interface OrderResult {
  id: string;
  numberFormatted: string;
  totals: { totalTzs: number; paidTzs: number; balanceTzs: number };
}

export const createOrder = (s: Session, payload: OrderPayload) =>
  call<OrderResult>('/orders', { method: 'POST', body: payload, token: s.token });

export const recordCash = (s: Session, orderId: string, amountTzs: number) =>
  call<{ payment: { id: string }; summary: { balanceTzs: number } }>(
    `/orders/${orderId}/payments`,
    { method: 'POST', body: { method: 'CASH', amountTzs }, token: s.token },
  );

export const initiateMm = (
  s: Session,
  orderId: string,
  input: { provider: string; msisdn: string; amountTzs: number },
) =>
  call<{ id: string; intentId: string; status: string }>(`/orders/${orderId}/mobile-money`, {
    method: 'POST',
    body: input,
    token: s.token,
  });

export const listMm = (s: Session, orderId: string) =>
  call<{ items: Array<{ intentId: string; status: string; appliedPaymentId: string | null }> }>(
    `/orders/${orderId}/mobile-money`,
    { token: s.token },
  );

/** Receipt HTML, or null while the fiscal queue is still working (404). */
export const getReceiptHtml = async (
  s: Session,
  orderId: string,
  paymentId: string,
): Promise<string | null> => {
  try {
    return await call<string>(`/orders/${orderId}/payments/${paymentId}/receipt`, { token: s.token });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
};
