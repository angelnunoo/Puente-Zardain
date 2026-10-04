import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateOrderItems } from './order-items.ts';

const burger = { id: 'burger', name: 'Hamburguesa', stock: 4 };

describe('evaluateOrderItems', () => {
  it('accepts two lines of the same product when customizations differ', () => {
    const result = evaluateOrderItems(
      [burger],
      [
        { productId: 'burger', quantity: 1 },
        { productId: 'burger', quantity: 1 },
      ],
    );

    assert.deepEqual(result, { ok: true });
  });

  it('rejects a product id that was not found', () => {
    const result = evaluateOrderItems([burger], [{ productId: 'missing', quantity: 1 }]);

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.message, 'One or more products are invalid or unavailable');
    }
  });

  it('rejects when the summed quantity exceeds stock', () => {
    const result = evaluateOrderItems(
      [burger],
      [
        { productId: 'burger', quantity: 3 },
        { productId: 'burger', quantity: 2 },
      ],
      { checkStock: true },
    );

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.message, 'No hay suficiente stock para Hamburguesa');
    }
  });

  it('allows separate lines whose combined quantity is still in stock', () => {
    const result = evaluateOrderItems(
      [burger],
      [
        { productId: 'burger', quantity: 2 },
        { productId: 'burger', quantity: 2 },
      ],
      { checkStock: true },
    );

    assert.deepEqual(result, { ok: true });
  });
});
