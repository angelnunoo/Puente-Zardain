import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { EventBusService } from '../common/events/event-bus.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ScheduleService } from '../schedule/schedule.service';
import { ZardasService } from '../zardas/zardas.service';
import { OrderStatus, PaymentMethod, Role } from '../../../shared/enums';

const mockPrismaService = {
  $transaction: jest.fn(),
};

const mockOrdersRepository = {
  findProductsByIds: jest.fn(),
  findAllForUser: jest.fn(),
  findById: jest.fn(),
  updateStatus: jest.fn(),
};

const mockEventBus = {
  emit: jest.fn(),
};

const mockScheduleService = {
  assertOpenForOrders: jest.fn(),
};

const mockZardasService = {
  addZardas: jest.fn(),
  getBalance: jest.fn(),
  getOffer: jest.fn(),
  getLeagueRank: jest.fn(),
  redeemZardas: jest.fn(),
};

const mockTransaction = {
  order: {
    create: jest.fn(),
    update: jest.fn(),
  },
  product: {
    updateMany: jest.fn(),
  },
  chat: {
    create: jest.fn(),
  },
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

  beforeEach(() => {
    mockScheduleService.assertOpenForOrders.mockResolvedValue(undefined);
    mockPrismaService.$transaction.mockImplementation((callback) => callback(mockTransaction));
    mockTransaction.order.create.mockResolvedValue({ id: 'order123456', total: 19, items: [], user: {} });
    mockTransaction.product.updateMany.mockResolvedValue({ count: 1 });
    mockTransaction.chat.create.mockResolvedValue({ id: 'chat-1' });
    mockZardasService.getBalance.mockResolvedValue({ available: 100, league: 'Bronce Zarda' });
    mockZardasService.getLeagueRank.mockReturnValue(1);
    mockZardasService.redeemZardas.mockResolvedValue({ available: 97 });
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

  it('creates order items with price snapshots and redeems zardas inside the order transaction', async () => {
    mockOrdersRepository.findProductsByIds.mockResolvedValue([
      { id: 'p1', name: 'Burger', price: 10, stock: 5 },
    ]);

    await service.create('user-id', {
      items: [{ productId: 'p1', quantity: 2 }],
      delivery: false,
      paymentMethod: PaymentMethod.CARD,
      redemption: { discountAmount: 3 },
    } as any);

    expect(mockTransaction.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subtotal: 20,
          discount: 3,
          total: 19,
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
      where: {
        id: 'p1',
        stock: { gte: 2 },
      },
      data: { stock: { decrement: 2 } },
    });
    expect(mockZardasService.redeemZardas).toHaveBeenCalledWith(
      'user-id',
      3,
      expect.stringContaining('order1234'),
      mockTransaction,
    );
  });

  it('uses the JWT userId when listing orders for a regular user', async () => {
    mockOrdersRepository.findAllForUser.mockResolvedValue([]);

    await service.findAll({ userId: 'jwt-user-id', role: Role.USER });

    expect(mockOrdersRepository.findAllForUser).toHaveBeenCalledWith('jwt-user-id', Role.USER);
  });

  it('rejects non-admin order listing without an authenticated user id', async () => {
    await expect(service.findAll({ role: Role.USER })).rejects.toThrow(BadRequestException);
    expect(mockOrdersRepository.findAllForUser).not.toHaveBeenCalled();
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
