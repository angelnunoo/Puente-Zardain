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
    count: jest.fn(),
  },
  fraudAttempt: {
    create: jest.fn(),
  },
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
  getBalance: jest.fn(),
  getOffer: jest.fn(),
  getLeagueRank: jest.fn(),
};

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    mockScheduleService.assertOpenForOrders.mockResolvedValue(undefined);
    mockPrismaService.order.count.mockResolvedValue(0);
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

  it('should snapshot item prices and aggregate duplicate products when creating orders', async () => {
    const tx = {
      order: {
        create: jest.fn().mockResolvedValue({ id: 'order-id', total: 26.4 }),
      },
      product: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      zardasBalance: {
        updateMany: jest.fn(),
        findUnique: jest.fn(),
      },
      zardasTransaction: {
        create: jest.fn(),
      },
      user: {
        update: jest.fn(),
      },
      chat: {
        create: jest.fn(),
      },
    };
    mockPrismaService.$transaction.mockImplementation((callback: any) => callback(tx));
    mockOrdersRepository.findProductsByIds.mockResolvedValue([{ id: 'p1', name: 'Tortilla', price: 8, stock: 5 }]);

    await service.create('user-id', {
      items: [
        { productId: 'p1', quantity: 1 },
        { productId: 'p1', quantity: 2, customizations: 'sin cebolla' },
      ],
      delivery: false,
      paymentMethod: PaymentMethod.CASH,
    });

    expect(mockOrdersRepository.findProductsByIds).toHaveBeenCalledWith(['p1']);
    expect(tx.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          items: {
            create: [
              { productId: 'p1', quantity: 1, price: 8, subtotal: 8, customizations: undefined },
              { productId: 'p1', quantity: 2, price: 8, subtotal: 16, customizations: 'sin cebolla' },
            ],
          },
        }),
      }),
    );
    expect(tx.product.updateMany).toHaveBeenCalledWith({
      where: { id: 'p1', stock: { gte: 3 } },
      data: { stock: { decrement: 3 } },
    });
  });

  it('should scope non-admin order lists to the JWT userId', async () => {
    mockOrdersRepository.findAllForUser.mockResolvedValue([]);

    await service.findAll({ userId: 'user-id', role: Role.USER });

    expect(mockOrdersRepository.findAllForUser).toHaveBeenCalledWith('user-id', Role.USER);
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
