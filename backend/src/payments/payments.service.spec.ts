import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';
import { PaymentMethod, Role } from '../../../shared/enums';

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

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PaymentsService(mockPrismaService as unknown as PrismaService);
  });

  it('should generate an invoice for the order owner', async () => {
    mockPrismaService.order.findUnique.mockResolvedValue({
      id: 'order2',
      userId: 'user-1',
      total: 20,
      subtotal: 18,
      tax: 2,
      deliveryFee: 0,
      paymentMethod: PaymentMethod.CASH,
      user: { name: 'Ana', email: 'ana@example.com', phone: '600000000' },
      items: [{ quantity: 2, price: 9, product: { name: 'Tortilla' } }],
    });
    mockPrismaService.invoice.create.mockResolvedValue({ id: 'inv-1', orderId: 'order2' });

    const result = await service.generateInvoice('order2', { userId: 'user-1', role: Role.USER });

    expect(mockPrismaService.invoice.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orderId: 'order2',
        userId: 'user-1',
        invoiceNumber: expect.stringMatching(/^INV-\d{4}-/),
      }),
    });
    expect(result).toEqual({ id: 'inv-1', orderId: 'order2' });
  });

  it('should prevent non-owners from generating another user invoice', async () => {
    mockPrismaService.order.findUnique.mockResolvedValue({
      id: 'order2',
      userId: 'user-1',
      user: { name: 'Ana', email: 'ana@example.com', phone: '600000000' },
      items: [],
    });

    await expect(
      service.generateInvoice('order2', { userId: 'user-2', role: Role.USER }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should return enabled in-person payment methods for an amount', async () => {
    const result = await service.getAvailablePaymentMethods(25);

    expect(result.map((method) => method.type)).toEqual([PaymentMethod.CARD, PaymentMethod.CASH]);
  });
});
