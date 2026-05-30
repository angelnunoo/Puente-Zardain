import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { EventBusService } from '../common/events/event-bus.service';
import { PrismaService } from '../prisma/prisma.service';
import { ScheduleService } from '../schedule/schedule.service';
import { ZardasService } from '../zardas/zardas.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentMethod, Role } from '../../../shared/enums';

const mockPrismaService = {
  order: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockOrdersRepository = {
  findProductsByIds: jest.fn(),
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
  getOffer: jest.fn(),
  getLeagueRank: jest.fn(),
  redeemZardasInTransaction: jest.fn(),
  addZardas: jest.fn(),
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

  it('should persist item price and subtotal when creating an order', async () => {
    const tx = {
      order: {
        create: jest.fn().mockResolvedValue({
          id: 'order-12345678',
          userId: 'user-id',
          total: 24.2,
          items: [],
          user: {},
        }),
      },
      product: { update: jest.fn() },
      chat: { create: jest.fn() },
    };
    mockPrismaService.$transaction.mockImplementation(async (callback) => callback(tx));
    mockOrdersRepository.findProductsByIds.mockResolvedValue([
      { id: 'p1', name: 'Pizza', price: 20, stock: 10 },
    ]);

    await service.create('user-id', {
      items: [{ productId: 'p1', quantity: 1 }],
      delivery: false,
      paymentMethod: PaymentMethod.CARD,
    } as any);

    expect(tx.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          items: {
            create: [
              expect.objectContaining({
                productId: 'p1',
                quantity: 1,
                price: 20,
                subtotal: 20,
              }),
            ],
          },
        }),
      }),
    );
  });

  it('should list only the authenticated user orders for non-admins', async () => {
    mockOrdersRepository.findAllForUser.mockResolvedValue([]);

    await service.findAll({ userId: 'user-id', role: Role.USER });

    expect(mockOrdersRepository.findAllForUser).toHaveBeenCalledWith('user-id', Role.USER);
  });

  it('should update order status only on valid transition', async () => {
    mockPrismaService.order.findUnique.mockResolvedValue({ id: 'o1', status: OrderStatus.PENDING });
    mockPrismaService.order.update.mockResolvedValue({ id: 'o1', status: OrderStatus.CONFIRMED });

    const result = await service.updateStatus('o1', { status: OrderStatus.CONFIRMED } as any);

    expect(result.status).toBe(OrderStatus.CONFIRMED);
    expect(mockEventBus.emit).toHaveBeenCalledWith('OrderStatusChanged', expect.any(Object));
  });

  it('should throw if order id does not exist', async () => {
    mockPrismaService.order.findUnique.mockResolvedValue(null);

    await expect(service.updateStatus('missing', { status: OrderStatus.CONFIRMED } as any)).rejects.toThrow(NotFoundException);
  });
});
