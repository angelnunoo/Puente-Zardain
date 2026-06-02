import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../common/events/event-bus.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PaymentMethod } from '../../../shared/enums';

const mockPrismaService = {
  order: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  invoice: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

const mockEventBus = {
  emit: jest.fn(),
};

const mockNotificationsService = {
  sendOrderUpdate: jest.fn(),
  sendError: jest.fn(),
};

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PaymentsService(
      mockPrismaService as unknown as PrismaService,
      mockEventBus as unknown as EventBusService,
      mockNotificationsService as unknown as NotificationsService,
    );
  });

  it('returns enabled payment methods for the requested amount', async () => {
    await expect(service.getAvailablePaymentMethods(20)).resolves.toEqual([
      expect.objectContaining({ type: PaymentMethod.CARD }),
      expect.objectContaining({ type: PaymentMethod.CASH }),
    ]);
  });

  it('generates an invoice from the persisted order snapshot', async () => {
    mockPrismaService.order.findUnique.mockResolvedValue({
      id: 'order1',
      userId: 'user-1',
      paymentMethod: PaymentMethod.CARD,
      subtotal: 20,
      tax: 2,
      deliveryFee: 0,
      total: 20,
      user: {
        name: 'Ada',
        email: 'ada@example.com',
        phone: '+34123456789',
      },
      items: [
        {
          quantity: 2,
          price: 10,
          product: { name: 'Burger' },
        },
      ],
    });
    mockPrismaService.invoice.create.mockResolvedValue({ id: 'invoice-1' });

    const result = await service.generateInvoice('order1');

    expect(mockPrismaService.invoice.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orderId: 'order1',
        userId: 'user-1',
        data: expect.objectContaining({
          items: [{ name: 'Burger', quantity: 2, unitPrice: 10, total: 20 }],
        }),
      }),
    });
    expect(result).toEqual({ id: 'invoice-1' });
  });

  it('lists invoices for one user only', async () => {
    mockPrismaService.invoice.findMany.mockResolvedValue([{ id: 'invoice-1' }]);

    const result = await service.getInvoices('user-1');

    expect(mockPrismaService.invoice.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            id: true,
            total: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });
    expect(result).toEqual([{ id: 'invoice-1' }]);
  });

  it('calculates payment stats from succeeded orders', async () => {
    mockPrismaService.order.findMany.mockResolvedValue([
      { total: 10, paymentMethod: PaymentMethod.CARD },
      { total: 20, paymentMethod: PaymentMethod.CASH },
    ]);

    const result = await service.getPaymentStats();

    expect(result).toEqual(
      expect.objectContaining({
        totalOrders: 2,
        totalRevenue: 30,
        averageOrderValue: 15,
        paymentMethodStats: {
          [PaymentMethod.CARD]: 1,
          [PaymentMethod.CASH]: 1,
        },
      }),
    );
  });
});
