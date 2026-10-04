export type OrderLineRequest = {
  productId: string;
  quantity: number;
};

export type StockedProduct = {
  id: string;
  name: string;
  stock: number;
};

export type OrderItemEvaluation =
  | { ok: true }
  | { ok: false; message: string };

/**
 * A cart can contain the same product more than once when customizations differ.
 * Product lookup is unique by id, so availability must be based on the set of
 * ids and the summed quantity, not on line count.
 */
export function evaluateOrderItems(
  products: StockedProduct[],
  items: OrderLineRequest[],
  options: { checkStock?: boolean } = {},
): OrderItemEvaluation {
  const known = new Map(products.map((product) => [product.id, product]));

  for (const item of items) {
    if (!known.has(item.productId)) {
      return { ok: false, message: 'One or more products are invalid or unavailable' };
    }
  }

  if (!options.checkStock) {
    return { ok: true };
  }

  const totals = new Map<string, number>();
  for (const item of items) {
    totals.set(item.productId, (totals.get(item.productId) ?? 0) + item.quantity);
  }

  for (const [productId, quantity] of totals) {
    const product = known.get(productId);
    if (product && product.stock < quantity) {
      return { ok: false, message: `No hay suficiente stock para ${product.name}` };
    }
  }

  return { ok: true };
}
