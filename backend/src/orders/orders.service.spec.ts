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
};

describe('OrdersService', () => {
  let service: OrdersService;
  let tx: any;

  beforeEach(async () => {
    tx = {
      order: {
        create: jest.fn().mockResolvedValue({
          id: 'order-1',
          userId: 'user-id',
          total: 22,
          items: [],
          user: {},
        }),
      },
      product: {
        update: jest.fn(),
      },
      chat: {
        create: jest.fn(),
      },
    };

    mockPrismaService.$transaction.mockImplementation((callback: any) => callback(tx));
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

  it('should persist price and subtotal for order items', async () => {
    mockOrdersRepository.findProductsByIds.mockResolvedValue([
      { id: 'p1', name: 'Tortilla', price: 10, stock: 5 },
    ]);

    await service.create('user-id', {
      items: [{ productId: 'p1', quantity: 2, customizations: 'sin cebolla' }],
      delivery: false,
      paymentMethod: PaymentMethod.CASH,
    } as any);

    expect(tx.order.create).toHaveBeenCalledWith(
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
                customizations: 'sin cebolla',
              },
            ],
          },
        }),
      }),
    );
  });

  it('should use the JWT subject when listing a user orders', async () => {
    mockOrdersRepository.findAllForUser.mockResolvedValue([]);

    await service.findAll({ userId: 'user-1', role: Role.USER });

    expect(mockOrdersRepository.findAllForUser).toHaveBeenCalledWith('user-1', Role.USER);
  });

  it('should not list all orders when a non-admin user id is missing', async () => {
    await expect(service.findAll({ role: Role.USER } as any)).rejects.toThrow(BadRequestException);
    expect(mockOrdersRepository.findAllForUser).not.toHaveBeenCalled();
  });

  it('should update order status only on valid transition', async () => {
    mockOrdersRepository.findById.mockResolvedValue({
      id: 'o1',
      userId: 'user-1',
      total: 20,
      status: OrderStatus.PENDING,
      zardasAwarded: false,
    });
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
