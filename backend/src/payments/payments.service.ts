import { ForbiddenException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentMethod, Role } from '../../../shared/enums';

interface PaymentMethodConfig {
  type: PaymentMethod;
  enabled: boolean;
  fee: number;
  minAmount: number;
  maxAmount: number;
}

interface InvoiceData {
  orderId: string;
  userId: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address?: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger('PaymentsService');

  // Configuración de métodos de pago
  private readonly paymentMethods: PaymentMethodConfig[] = [
    {
      type: PaymentMethod.CARD,
      enabled: true,
      fee: 0,
      minAmount: 1,
      maxAmount: 10000,
    },
    {
      type: PaymentMethod.CASH,
      enabled: true,
      fee: 0,
      minAmount: 1,
      maxAmount: 10000,
    },
  ];

  constructor(private readonly prisma: PrismaService) {}

  // ==================== MÉTODOS DE PAGO ====================

  async getAvailablePaymentMethods(amount: number): Promise<PaymentMethodConfig[]> {
    return this.paymentMethods.filter(method => 
      method.enabled && 
      amount >= method.minAmount && 
      amount <= method.maxAmount
    );
  }

  // ==================== FACTURACIÓN ====================

  async generateInvoice(orderId: string, actor?: { userId: string; role: Role | string }): Promise<any> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: true
      }
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    if (actor && actor.role !== Role.ADMIN && actor.userId !== order.userId) {
      throw new ForbiddenException('No tienes permiso para generar esta factura.');
    }

    const invoiceData: InvoiceData = {
      orderId: order.id,
      userId: order.userId,
      customerInfo: {
        name: order.user.name,
        email: order.user.email,
        phone: order.user.phone,
      },
      items: order.items.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        unitPrice: item.price,
        total: item.price * item.quantity
      })),
      subtotal: order.subtotal,
      tax: order.tax,
      deliveryFee: order.deliveryFee,
      total: order.total,
      paymentMethod: order.paymentMethod
    };

    // Generar número de factura
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(order.id).padStart(6, '0')}`;
    
    // Crear registro de factura
    const invoice = await this.prisma.invoice.create({
      data: {
        orderId: order.id,
        userId: order.userId,
        invoiceNumber,
        data: invoiceData,
        pdfUrl: `/invoices/${invoiceNumber}.pdf`, // URL simulada
        createdAt: new Date(),
      }
    });

    this.logger.log(`Invoice generated: ${invoiceNumber} for order ${orderId}`);
    return invoice;
  }

  async getInvoices(userId: string) {
    return this.prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            id: true,
            total: true,
            status: true,
            createdAt: true
          }
        }
      }
    });
  }

  // ==================== MÉTRICAS ====================

  async getPaymentStats(startDate?: Date, endDate?: Date) {
    const where = startDate && endDate ? {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      paymentStatus: 'SUCCEEDED'
    } : { paymentStatus: 'SUCCEEDED' };

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        user: true
      }
    });

    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    const paymentMethodStats = orders.reduce((stats, order) => {
      stats[order.paymentMethod] = (stats[order.paymentMethod] || 0) + 1;
      return stats;
    }, {} as Record<PaymentMethod, number>);

    return {
      totalOrders: orders.length,
      totalRevenue,
      averageOrderValue,
      paymentMethodStats,
      period: { startDate, endDate }
    };
  }
}
