import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { EventBusService } from '../common/events/event-bus.service';
import { PrismaService } from '../prisma/prisma.service';
import { ScheduleService } from '../schedule/schedule.service';
import { ZardasService } from '../zardas/zardas.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentMethod } from '../../../shared/enums';

const mockPrismaService = {
  order: {
    updateMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockOrdersRepository = {
  findProductsByIds: jest.fn(),
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

describe('OrdersService', () => {
  let service: OrdersService;
  const transactionClient = {
    order: {
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    product: {
      update: jest.fn(),
    },
    chat: {
      create: jest.fn(),
    },
  };

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
    mockPrismaService.$transaction.mockImplementation((callback) => callback(transactionClient));
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

  it('should redeem Zardas inside the order transaction', async () => {
    mockOrdersRepository.findProductsByIds.mockResolvedValue([{ id: 'p1', name: 'Burger', price: 20, stock: 5 }]);
    mockZardasService.getBalance.mockResolvedValue({ available: 10, league: 'Bronce Zarda' });
    transactionClient.order.create.mockResolvedValue({ id: 'order-123456', total: 17, items: [], user: {} });
    transactionClient.product.update.mockResolvedValue({});
    transactionClient.chat.create.mockResolvedValue({});
    mockZardasService.redeemZardas.mockResolvedValue({ available: 5 });

    await service.create('user-id', {
      items: [{ productId: 'p1', quantity: 1 }],
      delivery: false,
      paymentMethod: PaymentMethod.CARD,
      redemption: { discountAmount: 5 },
    });

    expect(mockZardasService.redeemZardas).toHaveBeenCalledWith(
      'user-id',
      5,
      'Canje en pedido order-12',
      transactionClient,
    );
    expect(mockEventBus.emit).toHaveBeenCalledWith('OrderCreated', {
      orderId: 'order-123456',
      userId: 'user-id',
      total: 17,
    });
  });

  it('should not emit order creation when transactional redemption fails', async () => {
    mockOrdersRepository.findProductsByIds.mockResolvedValue([{ id: 'p1', name: 'Burger', price: 20, stock: 5 }]);
    mockZardasService.getBalance.mockResolvedValue({ available: 10, league: 'Bronce Zarda' });
    transactionClient.order.create.mockResolvedValue({ id: 'order-123456', total: 17, items: [], user: {} });
    transactionClient.product.update.mockResolvedValue({});
    transactionClient.chat.create.mockResolvedValue({});
    mockZardasService.redeemZardas.mockRejectedValue(new BadRequestException('Saldo de Zardas insuficiente'));

    await expect(
      service.create('user-id', {
        items: [{ productId: 'p1', quantity: 1 }],
        delivery: false,
        paymentMethod: PaymentMethod.CARD,
        redemption: { discountAmount: 5 },
      }),
    ).rejects.toThrow(BadRequestException);

    expect(mockEventBus.emit).not.toHaveBeenCalledWith('OrderCreated', expect.any(Object));
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

  it('should claim Zardas order awards atomically', async () => {
    mockOrdersRepository.findById.mockResolvedValue({
      id: 'order-123456',
      userId: 'user-id',
      status: OrderStatus.PREPARING,
      total: 25,
      zardasAwarded: false,
    });
    mockOrdersRepository.updateStatus.mockResolvedValue({ id: 'order-123456', status: OrderStatus.READY });
    transactionClient.order.updateMany.mockResolvedValue({ count: 1 });
    mockZardasService.addZardas.mockResolvedValue({ available: 5 });

    await service.updateStatus('order-123456', { status: OrderStatus.READY } as any);

    expect(transactionClient.order.updateMany).toHaveBeenCalledWith({
      where: { id: 'order-123456', zardasAwarded: false },
      data: { zardasAwarded: true },
    });
    expect(mockZardasService.addZardas).toHaveBeenCalledWith(
      'user-id',
      5,
      'Pedido order-12 completado',
      'ORDER_COMPLETION',
      'order-123456',
      undefined,
      transactionClient,
    );
  });
});
