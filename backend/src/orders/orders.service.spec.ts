import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { EventBusService } from '../common/events/event-bus.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentMethod } from '../../../shared/enums';
import { ScheduleService } from '../schedule/schedule.service';
import { ZardasService } from '../zardas/zardas.service';

const mockTransaction = {
  order: {
    create: jest.fn(),
    updateMany: jest.fn(),
  },
  product: {
    updateMany: jest.fn(),
  },
  chat: {
    create: jest.fn(),
  },
};

const mockPrismaService = {
  order: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn((callback: any) => callback(mockTransaction)),
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
  getOffer: jest.fn(),
  getLeagueRank: jest.fn(),
};

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
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

  it('should snapshot item prices and decrement stock atomically when creating an order', async () => {
    mockOrdersRepository.findProductsByIds.mockResolvedValue([{ id: 'p1', name: 'Pizza', price: 10, stock: 5 }]);
    mockTransaction.order.create.mockResolvedValue({ id: 'order-1', total: 22, items: [], user: {} });
    mockTransaction.product.updateMany.mockResolvedValue({ count: 1 });
    mockTransaction.chat.create.mockResolvedValue({});

    await service.create('user-id', {
      items: [{ productId: 'p1', quantity: 2 }],
      delivery: false,
      paymentMethod: PaymentMethod.CARD,
    } as any);

    expect(mockTransaction.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subtotal: 20,
          tax: 2,
          total: 22,
          items: {
            create: [
              {
                productId: 'p1',
                quantity: 2,
                price: 10,
                subtotal: 20,
                customizations: undefined,
              },
            ],
          },
        }),
      }),
    );
    expect(mockTransaction.product.updateMany).toHaveBeenCalledWith({
      where: { id: 'p1', stock: { gte: 2 } },
      data: { stock: { decrement: 2 } },
    });
  });

  it('should redeem Zardas inside the order transaction when a discount is applied', async () => {
    mockOrdersRepository.findProductsByIds.mockResolvedValue([{ id: 'p1', name: 'Pizza', price: 10, stock: 5 }]);
    mockZardasService.getBalance.mockResolvedValue({ available: 10 });
    mockTransaction.order.create.mockResolvedValue({ id: 'order-1', total: 17, items: [], user: {} });
    mockTransaction.product.updateMany.mockResolvedValue({ count: 1 });
    mockTransaction.chat.create.mockResolvedValue({});

    await service.create('user-id', {
      items: [{ productId: 'p1', quantity: 2 }],
      delivery: false,
      paymentMethod: PaymentMethod.CARD,
      redemption: { discountAmount: 5 },
    } as any);

    expect(mockZardasService.redeemZardas).toHaveBeenCalledWith(
      'user-id',
      5,
      'Canje en pedido order-1',
      mockTransaction,
    );
  });

  it('should list only orders for the JWT user id for non-admins', async () => {
    mockOrdersRepository.findAllForUser.mockResolvedValue([]);

    await service.findAll({ userId: 'jwt-user', role: 'USER' });

    expect(mockOrdersRepository.findAllForUser).toHaveBeenCalledWith('jwt-user', 'USER');
  });

  it('should update order status only on valid transition', async () => {
    mockOrdersRepository.findById.mockResolvedValue({ id: 'o1', status: OrderStatus.PENDING });
    mockOrdersRepository.updateStatus.mockResolvedValue({ id: 'o1', status: OrderStatus.CONFIRMED });

    const result = await service.updateStatus('o1', { status: OrderStatus.CONFIRMED } as any);

    expect(result.status).toBe(OrderStatus.CONFIRMED);
    expect(mockEventBus.emit).toHaveBeenCalledWith('OrderStatusChanged', expect.any(Object));
  });

  it('should throw if order id does not exist', async () => {
    mockOrdersRepository.findById.mockResolvedValue(null);

    await expect(service.updateStatus('missing', { status: OrderStatus.CONFIRMED } as any)).rejects.toThrow(NotFoundException);
  });
});
