import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { EventBusService } from '../common/events/event-bus.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentMethod, Role } from '../../../shared/enums';
import { ScheduleService } from '../schedule/schedule.service';
import { ZardasService } from '../zardas/zardas.service';

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
  findById: jest.fn(),
  updateStatus: jest.fn(),
};

const mockScheduleService = {
  assertOpenForOrders: jest.fn(),
};

const mockZardasService = {
  getBalance: jest.fn(),
  getOffer: jest.fn(),
  getLeagueRank: jest.fn(),
  redeemZardas: jest.fn(),
  addZardas: jest.fn(),
};

const mockEventBus = {
  emit: jest.fn(),
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
    mockScheduleService.assertOpenForOrders.mockResolvedValue({ isOpenNow: true });
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

  it('creates order items with price snapshots required by the schema', async () => {
    mockOrdersRepository.findProductsByIds.mockResolvedValue([
      { id: 'p1', name: 'Tortilla', price: 12, stock: 5 },
    ]);

    const tx = {
      order: {
        create: jest.fn().mockResolvedValue({
          id: 'order-1',
          userId: 'user-id',
          total: 26.4,
          items: [],
        }),
      },
      product: { update: jest.fn() },
      chat: { create: jest.fn() },
    };
    mockPrismaService.$transaction.mockImplementation((callback) => callback(tx));

    await service.create('user-id', {
      items: [{ productId: 'p1', quantity: 2 }],
      delivery: false,
      paymentMethod: PaymentMethod.CARD,
    } as any);

    expect(tx.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subtotal: 24,
          items: {
            create: [
              expect.objectContaining({
                productId: 'p1',
                quantity: 2,
                price: 12,
                subtotal: 24,
              }),
            ],
          },
        }),
      }),
    );
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

  it('scopes order listing to the authenticated JWT subject', async () => {
    mockOrdersRepository.findAllForUser.mockResolvedValue([{ id: 'order-1', userId: 'user-id' }]);

    await service.findAll({ userId: 'user-id', role: Role.USER });

    expect(mockOrdersRepository.findAllForUser).toHaveBeenCalledWith('user-id', Role.USER);
  });

  it('rejects non-admin order listing without a user id instead of querying unscoped', async () => {
    await expect(service.findAll({ role: Role.USER } as any)).rejects.toThrow(BadRequestException);

    expect(mockOrdersRepository.findAllForUser).not.toHaveBeenCalled();
  });
});
