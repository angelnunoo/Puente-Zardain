export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum KitchenStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  SATURATED = 'saturated',
}

export enum UserLeague {
  BRONZE = 'Bronce Zarda',
  SILVER = 'Plata Zarda',
  GOLD = 'Oro Zarda',
  PLATINUM = 'Platino Zarda',
}