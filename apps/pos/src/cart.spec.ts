import { describe, expect, it } from 'vitest';
import { addToCart, cartTotalTzs, changeQty, removeLine, validDeposit, type CartProduct } from './cart.js';

const fridge: CartProduct = { id: 'p1', brand: 'Samsung', model: 'RT38', sku: null, priceTzs: 1650000, isSerialized: true };
const cable: CartProduct = { id: 'p2', brand: 'Generic', model: 'HDMI', sku: 'C-1', priceTzs: 15000, isSerialized: false };

describe('POS cart (T2.6)', () => {
  it('adds new lines and increments existing ones', () => {
    let lines = addToCart([], fridge);
    lines = addToCart(lines, cable);
    lines = addToCart(lines, cable);
    expect(lines).toHaveLength(2);
    expect(lines.find((l) => l.product.id === 'p2')?.qty).toBe(2);
  });

  it('changes quantity and drops a line reaching zero', () => {
    let lines = addToCart(addToCart([], cable), cable); // qty 2
    lines = changeQty(lines, 'p2', -1);
    expect(lines[0].qty).toBe(1);
    lines = changeQty(lines, 'p2', -1);
    expect(lines).toHaveLength(0);
  });

  it('removes a line outright', () => {
    const lines = addToCart(addToCart([], fridge), cable);
    expect(removeLine(lines, 'p1').map((l) => l.product.id)).toEqual(['p2']);
  });

  it('totals in integer TZS', () => {
    const lines = addToCart(addToCart(addToCart([], fridge), cable), cable);
    expect(cartTotalTzs(lines)).toBe(1650000 + 2 * 15000);
  });

  it('deposit must be a whole amount ≥1 and strictly below the total', () => {
    const lines = addToCart([], cable); // total 15,000
    expect(validDeposit(lines, 5000)).toBe(true);
    expect(validDeposit(lines, 15000)).toBe(false); // that's full payment, not a deposit
    expect(validDeposit(lines, 0)).toBe(false);
    expect(validDeposit(lines, 100.5)).toBe(false);
  });
});
