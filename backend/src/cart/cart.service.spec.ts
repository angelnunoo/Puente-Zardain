import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  cart: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
  cartItem: {
    deleteMany: jest.fn(),
    createMany: jest.fn(),
  },
};

describe('CartService', () => {
  let service: CartService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
  });

  it('should return cart with items and product data', async () => {
    mockPrismaService.cart.findUnique.mockResolvedValue({
      id: 'cart-1',
      userId: 'user-1',
      items: [{ productId: 'p1', quantity: 2, customizations: 'sin cebolla', product: { id: 'p1', name: 'Pizza', price: 9.5 } }],
    });

    const cart = await service.getCart('user-1');

    expect(cart).toEqual(expect.objectContaining({ userId: 'user-1' }));
    expect(mockPrismaService.cart.findUnique).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      include: { items: { include: { product: true } } },
    });
  });

  it('should upsert cart and replace items on update', async () => {
    mockPrismaService.cart.upsert.mockResolvedValue({ id: 'cart-1', userId: 'user-1' });
    mockPrismaService.cartItem.deleteMany.mockResolvedValue({ count: 1 });
    mockPrismaService.cartItem.createMany.mockResolvedValue({ count: 2 });
    mockPrismaService.cart.findUnique.mockResolvedValue({
      id: 'cart-1',
      userId: 'user-1',
      items: [{ productId: 'p1', quantity: 2, customizations: 'sin cebolla', product: { id: 'p1', name: 'Pizza', price: 9.5 } }],
    });

    const result = await service.updateCart('user-1', {
      items: [
        { productId: 'p1', quantity: 2, customizations: 'sin cebolla' },
        { productId: 'p2', quantity: 1 },
      ],
    });

    expect(mockPrismaService.cart.upsert).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      update: {},
      create: { userId: 'user-1' },
    });
    expect(mockPrismaService.cartItem.deleteMany).toHaveBeenCalledWith({ where: { cartId: 'cart-1' } });
    expect(mockPrismaService.cartItem.createMany).toHaveBeenCalledWith({
      data: [
        { cartId: 'cart-1', productId: 'p1', quantity: 2, customizations: 'sin cebolla' },
        { cartId: 'cart-1', productId: 'p2', quantity: 1, customizations: undefined },
      ],
    });
    expect(result).toEqual(expect.objectContaining({ userId: 'user-1' }));
  });

  it('should clear cart items if cart exists', async () => {
    mockPrismaService.cart.findUnique.mockResolvedValue({ id: 'cart-1' });
    mockPrismaService.cartItem.deleteMany.mockResolvedValue({ count: 1 });

    const result = await service.clearCart('user-1');

    expect(mockPrismaService.cart.findUnique).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    expect(mockPrismaService.cartItem.deleteMany).toHaveBeenCalledWith({ where: { cartId: 'cart-1' } });
    expect(result).toEqual({ success: true });
  });

  it('should return success when clearing a non-existing cart', async () => {
    mockPrismaService.cart.findUnique.mockResolvedValue(null);

    const result = await service.clearCart('user-1');

    expect(mockPrismaService.cartItem.deleteMany).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });
});
