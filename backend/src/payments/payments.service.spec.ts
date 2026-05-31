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

  it('should expose only enabled MVP payment methods for an amount', async () => {
    await expect(service.getAvailablePaymentMethods(20)).resolves.toEqual([
      { type: PaymentMethod.CARD, enabled: true, fee: 0, minAmount: 1, maxAmount: 10000 },
      { type: PaymentMethod.CASH, enabled: true, fee: 0, minAmount: 1, maxAmount: 10000 },
    ]);
  });

  it('should generate an invoice from an order snapshot', async () => {
    mockPrismaService.order.findUnique.mockResolvedValue({
      id: 'order1',
      userId: 'user1',
      subtotal: 20,
      tax: 2,
      deliveryFee: 0,
      total: 22,
      paymentMethod: PaymentMethod.CARD,
      user: { name: 'Ada', email: 'ada@example.com', phone: '600000000' },
      items: [{ quantity: 2, price: 10, product: { name: 'Burger' } }],
    });
    mockPrismaService.invoice.create.mockResolvedValue({ id: 'invoice1' });

    await expect(service.generateInvoice('order1')).resolves.toEqual({ id: 'invoice1' });

    expect(mockPrismaService.invoice.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orderId: 'order1',
        userId: 'user1',
        invoiceNumber: expect.stringMatching(/^INV-/),
      }),
    });
  });
});
