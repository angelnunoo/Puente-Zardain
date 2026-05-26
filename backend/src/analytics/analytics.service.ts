import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportPeriod } from '../../../shared/enums';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger('AnalyticsService');

  constructor(private readonly prisma: PrismaService) {}

  async getDashboardMetrics(startDate?: Date, endDate?: Date) {
    const dateFilter = this.buildDateFilter(startDate, endDate);

    const [
      totalOrders,
      totalRevenue,
      totalUsers,
      activeProducts,
      averageOrderValue,
      topProducts,
      paymentStats,
      hourlyStats,
      dailyStats
    ] = await Promise.all([
      this.getTotalOrders(dateFilter),
      this.getTotalRevenue(dateFilter),
      this.getTotalUsers(),
      this.getActiveProducts(),
      this.getAverageOrderValue(dateFilter),
      this.getTopProducts(dateFilter),
      this.getPaymentStats(dateFilter),
      this.getHourlyStats(dateFilter),
      this.getDailyStats(dateFilter)
    ]);

    return {
      overview: {
        totalOrders,
        totalRevenue,
        totalUsers,
        activeProducts,
        averageOrderValue
      },
      topProducts,
      paymentStats,
      hourlyStats,
      dailyStats
    };
  }

  async getSalesReport(period: ReportPeriod, startDate?: Date, endDate?: Date) {
    const dateFilter = this.buildDateFilter(startDate, endDate);

    const orders = await this.prisma.order.findMany({
      where: {
        ...dateFilter,
        paymentStatus: 'SUCCEEDED'
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const productSales = orders.reduce((acc, order) => {
      order.items.forEach(item => {
        const key = item.product.name;
        acc[key] = (acc[key] || 0) + item.quantity;
      });
      return acc;
    }, {} as Record<string, number>);

    const topProducts = Object.entries(productSales)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, quantity]) => ({ name, quantity }));

    return {
      period,
      totalRevenue,
      totalOrders,
      averageOrderValue,
      topProducts,
      orders: orders.slice(0, 100)
    };
  }

  async getCustomerAnalytics(startDate?: Date, endDate?: Date) {
    const dateFilter = this.buildDateFilter(startDate, endDate);

    const [
      totalCustomers,
      newCustomers,
      returningCustomers,
      topCustomers,
      customerLifetimeValue,
      customerRetention
    ] = await Promise.all([
      this.getTotalCustomers(dateFilter),
      this.getNewCustomers(dateFilter),
      this.getReturningCustomers(dateFilter),
      this.getTopCustomers(dateFilter),
      this.getCustomerLifetimeValue(dateFilter),
      this.getCustomerRetention(dateFilter)
    ]);

    return {
      totalCustomers,
      newCustomers,
      returningCustomers,
      topCustomers,
      customerLifetimeValue,
      customerRetention
    };
  }

  async getProductAnalytics(startDate?: Date, endDate?: Date) {
    const dateFilter = this.buildDateFilter(startDate, endDate);

    const [
      productPerformance,
      lowStockProducts,
      categoryPerformance,
      productTrends
    ] = await Promise.all([
      this.getProductPerformance(dateFilter),
      this.getLowStockProducts(),
      this.getCategoryPerformance(dateFilter),
      this.getProductTrends(dateFilter)
    ]);

    return {
      productPerformance,
      lowStockProducts,
      categoryPerformance,
      productTrends
    };
  }

  async getFinancialAnalytics(startDate?: Date, endDate?: Date) {
    const dateFilter = this.buildDateFilter(startDate, endDate);

    const [
      revenueBreakdown,
      paymentMethodStats,
      refunds,
      profitMargins,
      monthlyRevenue
    ] = await Promise.all([
      this.getRevenueBreakdown(dateFilter),
      this.getPaymentMethodStats(dateFilter),
      this.getRefunds(dateFilter),
      this.getProfitMargins(dateFilter),
      this.getMonthlyRevenue(dateFilter)
    ]);

    return {
      revenueBreakdown,
      paymentMethodStats,
      refunds,
      profitMargins,
      monthlyRevenue
    };
  }

  private async getTotalOrders(dateFilter: any) {
    return this.prisma.order.count({
      where: {
        ...dateFilter,
        paymentStatus: 'SUCCEEDED'
      }
    });
  }

  private async getTotalRevenue(dateFilter: any) {
    const result = await this.prisma.order.aggregate({
      where: {
        ...dateFilter,
        paymentStatus: 'SUCCEEDED'
      },
      _sum: {
        total: true
      }
    });
    return result._sum.total || 0;
  }

  private async getTotalUsers() {
    return this.prisma.user.count();
  }

  private async getActiveProducts() {
    return this.prisma.product.count({
      where: {
        active: true
      }
    });
  }

  private async getAverageOrderValue(dateFilter: any) {
    const result = await this.prisma.order.aggregate({
      where: {
        ...dateFilter,
        paymentStatus: 'SUCCEEDED'
      },
      _avg: {
        total: true
      }
    });
    return result._avg.total || 0;
  }

  private async getTopProducts(dateFilter: any) {
    const orders = await this.prisma.order.findMany({
      where: {
        ...dateFilter,
        paymentStatus: 'SUCCEEDED'
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    const productSales = orders.reduce((acc, order) => {
      order.items.forEach(item => {
        const key = item.product.name;
        if (!acc[key]) {
          acc[key] = { name: key, quantity: 0, revenue: 0 };
        }
        acc[key].quantity += item.quantity;
        acc[key].revenue += item.price * item.quantity;
      });
      return acc;
    }, {} as Record<string, any>);

    return Object.values(productSales)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 10);
  }

  private async getPaymentStats(dateFilter: any) {
    const orders = await this.prisma.order.findMany({
      where: {
        ...dateFilter,
        paymentStatus: 'SUCCEEDED'
      }
    });

    return orders.reduce((stats, order) => {
      stats[order.paymentMethod] = (stats[order.paymentMethod] || 0) + 1;
      return stats;
    }, {} as Record<string, number>);
  }

  private async getHourlyStats(dateFilter: any) {
    const orders = await this.prisma.order.findMany({
      where: {
        ...dateFilter,
        paymentStatus: 'SUCCEEDED'
      }
    });

    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      orders: 0,
      revenue: 0
    }));

    orders.forEach(order => {
      const hour = new Date(order.createdAt).getHours();
      hourlyData[hour].orders++;
      hourlyData[hour].revenue += order.total;
    });

    return hourlyData;
  }

  private async getDailyStats(dateFilter: any) {
    const orders = await this.prisma.order.findMany({
      where: {
        ...dateFilter,
        paymentStatus: 'SUCCEEDED'
      }
    });

    return orders.reduce((stats, order) => {
      const date = new Date(order.createdAt).toISOString().split('T')[0];
      if (!stats[date]) {
        stats[date] = { date, orders: 0, revenue: 0 };
      }
      stats[date].orders++;
      stats[date].revenue += order.total;
      return stats;
    }, {} as Record<string, any>);
  }

  private buildDateFilter(startDate?: Date, endDate?: Date) {
    if (!startDate && !endDate) return {};
    
    return {
      createdAt: {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate })
      }
    };
  }

  private async getTotalCustomers(dateFilter: any) {
    return this.prisma.user.count({
      where: {
        orders: {
          some: {
            ...dateFilter,
            paymentStatus: 'SUCCEEDED'
          }
        }
      }
    });
  }

  private async getNewCustomers(dateFilter: any) {
    return this.prisma.user.count({
      where: {
        createdAt: dateFilter.createdAt
      }
    });
  }

  private async getReturningCustomers(dateFilter: any) {
    const customers = await this.prisma.user.findMany({
      where: {
        orders: {
          some: {
            ...dateFilter,
            paymentStatus: 'SUCCEEDED'
          }
        }
      },
      include: {
        orders: {
          where: {
            paymentStatus: 'SUCCEEDED'
          }
        }
      }
    });

    return customers.filter(user => user.orders.length > 1).length;
  }

  private async getTopCustomers(dateFilter: any) {
    const orders = await this.prisma.order.findMany({
      where: {
        ...dateFilter,
        paymentStatus: 'SUCCEEDED'
      },
      include: {
        user: true
      }
    });

    const customerSpending = orders.reduce((acc, order) => {
      const userId = order.userId;
      if (!acc[userId]) {
        acc[userId] = {
          userId,
          name: order.user.name,
          email: order.user.email,
          totalSpent: 0,
          orderCount: 0
        };
      }
      acc[userId].totalSpent += order.total;
      acc[userId].orderCount++;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(customerSpending)
      .sort((a: any, b: any) => b.totalSpent - a.totalSpent)
      .slice(0, 10);
  }

  private async getCustomerLifetimeValue(dateFilter: any) {
    const result = await this.prisma.order.aggregate({
      where: {
        ...dateFilter,
        paymentStatus: 'SUCCEEDED'
      },
      _avg: {
        total: true
      }
    });
    return result._avg.total || 0;
  }

  private async getCustomerRetention(dateFilter: any) {
    const totalCustomers = await this.getTotalCustomers(dateFilter);
    const returningCustomers = await this.getReturningCustomers(dateFilter);
    return totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;
  }

  private async getProductPerformance(dateFilter: any) {
    const orders = await this.prisma.order.findMany({
      where: {
        ...dateFilter,
        paymentStatus: 'SUCCEEDED'
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    return orders.reduce((acc, order) => {
      order.items.forEach(item => {
        const key = item.product.id;
        if (!acc[key]) {
          acc[key] = {
            id: item.product.id,
            name: item.product.name,
            category: item.product.category,
            quantity: 0,
            revenue: 0,
            orders: 0
          };
        }
        acc[key].quantity += item.quantity;
        acc[key].revenue += item.price * item.quantity;
        acc[key].orders++;
      });
      return acc;
    }, {} as Record<string, any>);
  }

  private async getLowStockProducts() {
    return this.prisma.product.findMany({
      where: {
        stock: {
          lte: 10
        },
        active: true
      },
      select: {
        id: true,
        name: true,
        stock: true,
        category: true
      }
    });
  }

  private async getCategoryPerformance(dateFilter: any) {
    const orders = await this.prisma.order.findMany({
      where: {
        ...dateFilter,
        paymentStatus: 'SUCCEEDED'
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    return orders.reduce((acc, order) => {
      order.items.forEach(item => {
        const category = item.product.category;
        if (!acc[category]) {
          acc[category] = { category, quantity: 0, revenue: 0 };
        }
        acc[category].quantity += item.quantity;
        acc[category].revenue += item.price * item.quantity;
      });
      return acc;
    }, {} as Record<string, any>);
  }

  private async getProductTrends(dateFilter: any) {
    const orders = await this.prisma.order.findMany({
      where: {
        ...dateFilter,
        paymentStatus: 'SUCCEEDED'
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    const weeklyData = {};
    
    orders.forEach(order => {
      const week = this.getWeekNumber(new Date(order.createdAt));
      if (!weeklyData[week]) {
        weeklyData[week] = {};
      }
      
      order.items.forEach(item => {
        const productName = item.product.name;
        if (!weeklyData[week][productName]) {
          weeklyData[week][productName] = 0;
        }
        weeklyData[week][productName] += item.quantity;
      });
    });

    return weeklyData;
  }

  private async getRevenueBreakdown(dateFilter: any) {
    const orders = await this.prisma.order.findMany({
      where: {
        ...dateFilter,
        paymentStatus: 'SUCCEEDED'
      }
    });

    return {
      subtotal: orders.reduce((sum, order) => sum + order.subtotal, 0),
      tax: orders.reduce((sum, order) => sum + order.tax, 0),
      delivery: orders.reduce((sum, order) => sum + order.deliveryFee, 0),
      total: orders.reduce((sum, order) => sum + order.total, 0)
    };
  }

  private async getPaymentMethodStats(dateFilter: any) {
    const orders = await this.prisma.order.findMany({
      where: {
        ...dateFilter,
        paymentStatus: 'SUCCEEDED'
      }
    });

    return orders.reduce((stats, order) => {
      const method = order.paymentMethod;
      if (!stats[method]) {
        stats[method] = { count: 0, revenue: 0 };
      }
      stats[method].count++;
      stats[method].revenue += order.total;
      return stats;
    }, {} as Record<string, any>);
  }

  private async getRefunds(dateFilter: any) {
    const orders = await this.prisma.order.findMany({
      where: {
        ...dateFilter,
        paymentStatus: 'REFUNDED'
      }
    });

    return {
      count: orders.length,
      totalRefunded: orders.reduce((sum, order) => sum + order.total, 0),
      refundRate: orders.length / (await this.getTotalOrders(dateFilter)) * 100
    };
  }

  private async getProfitMargins(dateFilter: any) {
    const orders = await this.prisma.order.findMany({
      where: {
        ...dateFilter,
        paymentStatus: 'SUCCEEDED'
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalCost = orders.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => {
        return itemSum + (item.product.price || 0) * item.quantity;
      }, 0);
    }, 0);

    const profit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalCost,
      profit,
      profitMargin
    };
  }

  private async getMonthlyRevenue(dateFilter: any) {
    const orders = await this.prisma.order.findMany({
      where: {
        ...dateFilter,
        paymentStatus: 'SUCCEEDED'
      }
    });

    return orders.reduce((acc, order) => {
      const month = new Date(order.createdAt).toISOString().slice(0, 7);
      if (!acc[month]) {
        acc[month] = { month, revenue: 0, orders: 0 };
      }
      acc[month].revenue += order.total;
      acc[month].orders++;
      return acc;
    }, {} as Record<string, any>);
  }

  private getWeekNumber(date: Date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }
}
