import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../common/events/event-bus.service';
import { OrderStatus, PaymentMethod, Role } from '../../../shared/enums';

const mockPrismaService = {
  order: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

const mockStripeClient = {
  paymentIntents: {
    create: jest.fn(),
    retrieve: jest.fn(),
  },
  refunds: {
    create: jest.fn(),
  },
};

const mockEventBus = {
  emit: jest.fn(),
};

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    jest.clearAllMocks();
    service = new PaymentsService(
      mockPrismaService as unknown as PrismaService,
      mockEventBus as unknown as EventBusService,
    );
    (service as any).stripe = mockStripeClient;
  });

  it('should confirm and mark order paid when payment intent succeeds', async () => {
    mockPrismaService.order.findUnique.mockResolvedValue({ id: 'order1', status: OrderStatus.PENDING });
    mockPrismaService.order.update.mockResolvedValue({ id: 'order1', paymentStatus: 'SUCCEEDED', status: OrderStatus.CONFIRMED });

    const event = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          metadata: { orderId: 'order1' },
        },
      },
    } as any;

    const result = await service.handleWebhook(event);

    expect(mockPrismaService.order.findUnique).toHaveBeenCalledWith({ where: { id: 'order1' } });
    expect(mockPrismaService.order.update).toHaveBeenCalledWith({
      where: { id: 'order1' },
      data: {
        paymentStatus: 'SUCCEEDED',
        status: OrderStatus.CONFIRMED,
      },
    });
    expect(result).toEqual({ received: true });
    expect(mockEventBus.emit).toHaveBeenCalledWith('OrderStatusChanged', {
      orderId: 'order1',
      previousStatus: OrderStatus.PENDING,
      newStatus: OrderStatus.CONFIRMED,
    });
  });

  it('should create a payment intent only for the order owner', async () => {
    mockPrismaService.order.findUnique.mockResolvedValue({
      id: 'order2',
      userId: 'user-1',
      status: OrderStatus.PENDING,
      paymentMethod: PaymentMethod.CARD,
      total: 20,
    });
    mockStripeClient.paymentIntents.create.mockResolvedValue({ id: 'pi_123', client_secret: 'secret' });
    mockPrismaService.order.update.mockResolvedValue({ id: 'order2', paymentIntentId: 'pi_123' });

    const result = await service.createPaymentIntent('order2', { userId: 'user-1', role: Role.USER });

    expect(mockPrismaService.order.findUnique).toHaveBeenCalledWith({ where: { id: 'order2' } });
    expect(mockStripeClient.paymentIntents.create).toHaveBeenCalledWith({
      amount: 2000,
      currency: 'eur',
      metadata: { orderId: 'order2' },
      automatic_payment_methods: { enabled: true },
    });
    expect(mockPrismaService.order.update).toHaveBeenCalledWith({
      where: { id: 'order2' },
      data: { paymentIntentId: 'pi_123' },
    });
    expect(result).toEqual({ clientSecret: 'secret' });
  });

  it('should prevent non-owners from creating a payment intent', async () => {
    mockPrismaService.order.findUnique.mockResolvedValue({
      id: 'order2',
      userId: 'user-1',
      status: OrderStatus.PENDING,
      paymentMethod: PaymentMethod.CARD,
      total: 20,
    });

    await expect(
      service.createPaymentIntent('order2', { userId: 'user-2', role: Role.USER }),
    ).rejects.toThrow('No tienes permiso para pagar este pedido.');
  });

  it('should update refund status when charge is refunded', async () => {
    mockPrismaService.order.update.mockResolvedValue({ id: 'order1', paymentStatus: 'REFUNDED' });

    const event = {
      type: 'charge.refunded',
      data: {
        object: {
          metadata: { orderId: 'order1' },
        },
      },
    } as any;

    const result = await service.handleWebhook(event);

    expect(mockPrismaService.order.update).toHaveBeenCalledWith({
      where: { id: 'order1' },
      data: { paymentStatus: 'REFUNDED' },
    });
    expect(result).toEqual({ received: true });
    expect(mockEventBus.emit).not.toHaveBeenCalledWith('OrderStatusChanged', expect.anything());
  });
});
