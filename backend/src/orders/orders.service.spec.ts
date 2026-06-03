import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { EventBusService } from '../common/events/event-bus.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentMethod } from '../../../shared/enums';
import { ScheduleService } from '../schedule/schedule.service';
import { ZardasService } from '../zardas/zardas.service';

const mockPrismaService = {
  order: {
    updateMany: jest.fn(),
    count: jest.fn(),
  },
  fraudAttempt: {
    create: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockOrdersRepository = {
  findProductsByIds: jest.fn(),
  findById: jest.fn(),
  updateStatus: jest.fn(),
  findAllForUser: jest.fn(),
};

const mockEventBus = {
  emit: jest.fn(),
};

const mockScheduleService = {
  assertOpenForOrders: jest.fn(),
};

const mockZardasService = {
  getBalance: jest.fn(),
  redeemZardas: jest.fn(),
  addZardas: jest.fn(),
};

describe('OrdersService', () => {
  let service: OrdersService;
  let tx: any;

  beforeEach(async () => {
    tx = {
      order: {
        create: jest.fn().mockResolvedValue({ id: 'order-12345678', userId: 'user-id', total: 17 }),
      },
      product: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      chat: {
        create: jest.fn().mockResolvedValue({ id: 'chat-1' }),
      },
    };
    mockPrismaService.order.count.mockResolvedValue(0);
    mockPrismaService.$transaction.mockImplementation((callback) => callback(tx));
    mockScheduleService.assertOpenForOrders.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: OrdersRepository, useValue: mockOrdersRepository },
        { provide: EventBusService, useValue: mockEventBus },
        { provide: ScheduleService, useValue: mockScheduleService },
        { provide: ZardasService, useValue: mockZardasService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should reject delivery orders without address', async () => {
    await expect(
      service.create('user-id', {
        items: [{ productId: 'p1', quantity: 1 }],
        delivery: true,
        paymentMethod: PaymentMethod.CARD,
      } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject unknown product IDs', async () => {
    mockOrdersRepository.findProductsByIds.mockResolvedValue([]);

    await expect(
      service.create('user-id', {
        items: [{ productId: 'missing', quantity: 2 }],
        delivery: false,
        paymentMethod: PaymentMethod.CARD,
      } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('should snapshot item prices and redeem Zardas inside the order transaction', async () => {
    mockOrdersRepository.findProductsByIds.mockResolvedValue([
      { id: 'p1', name: 'Tortilla', price: 10, stock: 5 },
    ]);
    mockZardasService.getBalance.mockResolvedValue({ available: 10 });

    const result = await service.create('user-id', {
      items: [{ productId: 'p1', quantity: 2 }],
      delivery: false,
      paymentMethod: PaymentMethod.CASH,
      redemption: { discountAmount: 5 },
    });

    expect(result.id).toBe('order-12345678');
    expect(tx.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subtotal: 20,
          tax: 2,
          discount: 5,
          total: 17,
          items: {
            create: [
              expect.objectContaining({
                productId: 'p1',
                quantity: 2,
                price: 10,
                subtotal: 20,
              }),
            ],
          },
        }),
      }),
    );
    expect(tx.product.updateMany).toHaveBeenCalledWith({
      where: { id: 'p1', stock: { gte: 2 } },
      data: { stock: { decrement: 2 } },
    });
    expect(mockZardasService.redeemZardas).toHaveBeenCalledWith(
      'user-id',
      5,
      'Canje en pedido order-12',
      'order-12345678',
      tx,
    );
  });

  it('should reject client-controlled redemption amounts outside allowed tiers', async () => {
    mockOrdersRepository.findProductsByIds.mockResolvedValue([
      { id: 'p1', name: 'Tortilla', price: 100, stock: 5 },
    ]);
    mockZardasService.getBalance.mockResolvedValue({ available: 85 });

    await expect(
      service.create('user-id', {
        items: [{ productId: 'p1', quantity: 1 }],
        delivery: false,
        paymentMethod: PaymentMethod.CASH,
        redemption: { discountAmount: 85 },
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should update order status only on valid transition', async () => {
    mockOrdersRepository.findById.mockResolvedValue({ id: 'o1', status: OrderStatus.PENDING, zardasAwarded: true });
    mockOrdersRepository.updateStatus.mockResolvedValue({ id: 'o1', status: OrderStatus.CONFIRMED });

    const result = await service.updateStatus('o1', { status: OrderStatus.CONFIRMED } as any);

    expect(result.status).toBe(OrderStatus.CONFIRMED);
    expect(mockEventBus.emit).toHaveBeenCalledWith('OrderStatusChanged', expect.any(Object));
  });

  it('should throw if order id does not exist', async () => {
    mockOrdersRepository.findById.mockResolvedValue(null);

    await expect(service.updateStatus('missing', { status: OrderStatus.CONFIRMED } as any)).rejects.toThrow(NotFoundException);
  });

  it('should use the JWT userId claim when listing a user orders', async () => {
    mockOrdersRepository.findAllForUser.mockResolvedValue([{ id: 'o1' }]);

    await service.findAll({ userId: 'user-id', role: 'USER' });

    expect(mockOrdersRepository.findAllForUser).toHaveBeenCalledWith('user-id', 'USER');
  });
});
