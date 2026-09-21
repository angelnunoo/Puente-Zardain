export type CartLikeItem = {
  productId: string
  quantity: number
  customizations?: string
  name?: string
  price?: number
  image?: string
}

export type OrderPayloadItem = {
  productId: string
  quantity: number
  customizations?: string
}

export function toOrderPayloadItems(cartItems: CartLikeItem[]): OrderPayloadItem[] {
  return cartItems.map(({ productId, quantity, customizations }) => ({
    productId,
    quantity,
    ...(customizations ? { customizations } : {}),
  }))
}
