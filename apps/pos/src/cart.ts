/** Pure cart logic (T2.6) — kept UI-free so it unit-tests without a DOM. */

export interface CartProduct {
  id: string;
  brand: string;
  model: string;
  sku: string | null;
  priceTzs: number;
  isSerialized: boolean;
}

export interface CartLine {
  product: CartProduct;
  qty: number;
}

export const addToCart = (lines: CartLine[], product: CartProduct): CartLine[] => {
  const existing = lines.find((l) => l.product.id === product.id);
  return existing
    ? lines.map((l) => (l.product.id === product.id ? { ...l, qty: l.qty + 1 } : l))
    : [...lines, { product, qty: 1 }];
};

/** delta of ±1; a line at qty 1 decremented is removed. */
export const changeQty = (lines: CartLine[], productId: string, delta: 1 | -1): CartLine[] =>
  lines
    .map((l) => (l.product.id === productId ? { ...l, qty: l.qty + delta } : l))
    .filter((l) => l.qty > 0);

export const removeLine = (lines: CartLine[], productId: string): CartLine[] =>
  lines.filter((l) => l.product.id !== productId);

export const cartTotalTzs = (lines: CartLine[]): number =>
  lines.reduce((sum, l) => sum + l.qty * l.product.priceTzs, 0);

/** Deposit must be a whole TZS amount, at least 1, strictly below the total. */
export const validDeposit = (lines: CartLine[], amountTzs: number): boolean =>
  Number.isSafeInteger(amountTzs) && amountTzs >= 1 && amountTzs < cartTotalTzs(lines);
