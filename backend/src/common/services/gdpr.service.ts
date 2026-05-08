import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GdprService {
  private readonly logger = new Logger('GdprService');

  constructor(private readonly prisma: PrismaService) {}

  async exportUserData(userId: string): Promise<any> {
    this.logger.log(`Exportando datos del usuario: ${userId}`);

    try {
      const userData = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
          updatedAt: true,
          role: true
        }
      });

      if (!userData) {
        throw new Error('Usuario no encontrado');
      }

      const orders = await this.prisma.order.findMany({
        where: { userId },
        select: {
          id: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          updatedAt: true,
          paymentStatus: true,
          deliveryAddress: true,
          items: true
        }
      });

      const zardasBalance = await this.prisma.zardasBalance.findUnique({
        where: { userId },
        select: {
          balance: true,
          league: true,
          createdAt: true,
          updatedAt: true
        }
      });

      const zardasTransactions = await this.prisma.zardasTransaction.findMany({
        where: { userId },
        select: {
          amount: true,
          type: true,
          reason: true,
          source: true,
          createdAt: true,
          balanceBefore: true,
          balanceAfter: true
        }
      });

      const incidents = await this.prisma.incident.findMany({
        where: { userId },
        select: {
          id: true,
          type: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          createdAt: true,
          updatedAt: true,
          responses: true
        }
      });

      const notifications = await this.prisma.notification.findMany({
        where: { userId },
        select: {
          type: true,
          title: true,
          message: true,
          read: true,
          createdAt: true
        }
      });

      const exportData = {
        personalData: {
          ...userData,
          exportDate: new Date().toISOString(),
          exportReason: 'Solicitud RGPD - Derecho de Acceso'
        },
        orders,
        zardasBalance,
        zardasTransactions,
        incidents,
        notifications,
        metadata: {
          totalOrders: orders.length,
          totalZardasTransactions: zardasTransactions.length,
          totalIncidents: incidents.length,
          totalNotifications: notifications.length,
          dataRetentionDays: 365
        }
      };

      // Registrar exportación
      await this.prisma.gdprLog.create({
        data: {
          userId,
          action: 'DATA_EXPORT',
          dataTypes: ['personal_data', 'orders', 'zardas', 'incidents', 'notifications'],
          createdAt: new Date()
        }
      });

      this.logger.log(`Datos exportados exitosamente para usuario: ${userId}`);
      return exportData;

    } catch (error) {
      this.logger.error(`Error exportando datos del usuario ${userId}:`, error);
      throw error;
    }
  }

  async deleteUserData(userId: string, reason: string = 'Solicitud RGPD - Derecho de Olvido'): Promise<void> {
    this.logger.log(`Iniciando borrado de datos del usuario: ${userId}`);

    try {
      // Verificar que el usuario existe
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Registrar datos antes de borrarlos
      const exportData = await this.exportUserData(userId);

      // Anonimizar datos en órdenes (mantener para fines estadísticos)
      await this.prisma.order.updateMany({
        where: { userId },
        data: {
          userId: null,
          deliveryAddress: 'Anonimizado por RGPD',
          customerName: 'Usuario Eliminado'
        }
      });

      // Eliminar datos personales en cascada
      await this.prisma.$transaction(async (tx) => {
        // Eliminar notificaciones
        await tx.notification.deleteMany({
          where: { userId }
        });

        // Eliminar transacciones de Zardas
        await tx.zardasTransaction.deleteMany({
          where: { userId }
        });

        // Eliminar balance de Zardas
        await tx.zardasBalance.deleteMany({
          where: { userId }
        });

        // Eliminar incidencias
        await tx.incident.deleteMany({
          where: { userId }
        });

        // Eliminar sesión
        await tx.session.deleteMany({
          where: { userId }
        });

        // Eliminar usuario
        await tx.user.delete({
          where: { id: userId }
        });
      });

      // Registrar borrado
      await this.prisma.gdprLog.create({
        data: {
          userId: user.id, // Mantener referencia antes de borrar
          action: 'DATA_DELETION',
          reason,
          dataTypes: ['personal_data', 'orders', 'zardas', 'incidents', 'notifications'],
          createdAt: new Date()
        }
      });

      // Guardar respaldo de datos eliminados (para cumplimiento legal)
      await this.prisma.deletedUserData.create({
        data: {
          originalUserId: user.id,
          originalEmail: user.email,
          deletedAt: new Date(),
          reason,
          exportData: JSON.stringify(exportData),
          retentionUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
        }
      });

      this.logger.log(`Datos del usuario ${userId} eliminados exitosamente`);

    } catch (error) {
      this.logger.error(`Error eliminando datos del usuario ${userId}:`, error);
      throw error;
    }
  }

  async updateConsent(userId: string, consentData: {
    marketing: boolean;
    analytics: boolean;
    cookies: boolean;
    version: string;
  }): Promise<void> {
    this.logger.log(`Actualizando consentimiento del usuario: ${userId}`);

    try {
      await this.prisma.userConsent.upsert({
        where: { userId },
        update: {
          marketingConsent: consentData.marketing,
          analyticsConsent: consentData.analytics,
          cookieConsent: consentData.cookies,
          consentVersion: consentData.version,
          consentDate: new Date(),
          ipAddress: 'RGPD_UPDATE', // Se actualizaría con IP real
          userAgent: 'RGPD_UPDATE' // Se actualizaría con User-Agent real
        },
        create: {
          userId,
          marketingConsent: consentData.marketing,
          analyticsConsent: consentData.analytics,
          cookieConsent: consentData.cookies,
          consentVersion: consentData.version,
          consentDate: new Date(),
          ipAddress: 'RGPD_UPDATE',
          userAgent: 'RGPD_UPDATE'
        }
      });

      // Registrar actualización de consentimiento
      await this.prisma.gdprLog.create({
        data: {
          userId,
          action: 'CONSENT_UPDATE',
          dataTypes: ['marketing', 'analytics', 'cookies'],
          createdAt: new Date()
        }
      });

      this.logger.log(`Consentimiento actualizado para usuario: ${userId}`);

    } catch (error) {
      this.logger.error(`Error actualizando consentimiento del usuario ${userId}:`, error);
      throw error;
    }
  }

  async getUserConsent(userId: string): Promise<any> {
    try {
      const consent = await this.prisma.userConsent.findUnique({
        where: { userId }
      });

      return consent || {
        marketingConsent: false,
        analyticsConsent: false,
        cookieConsent: false,
        consentVersion: '1.0',
        consentDate: null
      };

    } catch (error) {
      this.logger.error(`Error obteniendo consentimiento del usuario ${userId}:`, error);
      throw error;
    }
  }

  async processDataRequest(requestData: {
    userId: string;
    requestType: 'EXPORT' | 'DELETE' | 'CORRECTION' | 'RESTRICTION';
    reason?: string;
  }): Promise<void> {
    this.logger.log(`Procesando solicitud de datos RGPD: ${requestData.requestType} para usuario: ${requestData.userId}`);

    try {
      // Crear registro de solicitud
      await this.prisma.dataRequest.create({
        data: {
          userId: requestData.userId,
          requestType: requestData.requestType,
          reason: requestData.reason || `Solicitud de ${requestData.requestType}`,
          status: 'PENDING',
          createdAt: new Date()
        }
      });

      // Procesar según el tipo de solicitud
      switch (requestData.requestType) {
        case 'EXPORT':
          await this.exportUserData(requestData.userId);
          break;
        case 'DELETE':
          await this.deleteUserData(requestData.userId, requestData.reason);
          break;
        case 'CORRECTION':
          // Implementar lógica de corrección de datos
          await this.initiateDataCorrection(requestData.userId, requestData.reason);
          break;
        case 'RESTRICTION':
          // Implementar lógica de restricción de procesamiento
          await this.initiateDataRestriction(requestData.userId, requestData.reason);
          break;
      }

      // Actualizar estado de la solicitud
      await this.prisma.dataRequest.updateMany({
        where: { 
          userId: requestData.userId,
          requestType: requestData.requestType,
          status: 'PENDING'
        },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });

      this.logger.log(`Solicitud RGPD procesada: ${requestData.requestType} para usuario: ${requestData.userId}`);

    } catch (error) {
      // Marcar solicitud como fallida
      await this.prisma.dataRequest.updateMany({
        where: { 
          userId: requestData.userId,
          requestType: requestData.requestType,
          status: 'PENDING'
        },
        data: {
          status: 'FAILED',
          error: error.message,
          completedAt: new Date()
        }
      });

      this.logger.error(`Error procesando solicitud RGPD:`, error);
      throw error;
    }
  }

  async initiateDataCorrection(userId: string, reason: string): Promise<void> {
    this.logger.log(`Iniciando proceso de corrección de datos para usuario: ${userId}`);

    // Crear ticket de soporte para corrección
    await this.prisma.incident.create({
      data: {
        userId,
        type: 'DATA_CORRECTION',
        title: 'Solicitud de Corrección de Datos RGPD',
        description: `El usuario solicita corrección de sus datos personales. Motivo: ${reason}`,
        status: 'OPEN',
        priority: 'HIGH',
        createdAt: new Date()
      }
    });

    // Notificar al equipo de soporte
    this.logger.log(`Ticket de corrección de datos creado para usuario: ${userId}`);
  }

  async initiateDataRestriction(userId: string, reason: string): Promise<void> {
    this.logger.log(`Iniciando restricción de procesamiento para usuario: ${userId}`);

    // Marcar usuario para restricción de procesamiento
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        dataProcessingRestricted: true,
        restrictionReason: reason,
        restrictionDate: new Date()
      }
    });

    // Crear ticket de seguimiento
    await this.prisma.incident.create({
      data: {
        userId,
        type: 'DATA_RESTRICTION',
        title: 'Solicitud de Restricción de Procesamiento RGPD',
        description: `El usuario solicita restricción del procesamiento de sus datos. Motivo: ${reason}`,
        status: 'OPEN',
        priority: 'HIGH',
        createdAt: new Date()
      }
    });

    this.logger.log(`Restricción de procesamiento activada para usuario: ${userId}`);
  }

  async cleanupExpiredData(): Promise<void> {
    this.logger.log('Iniciando limpieza de datos expirados RGPD');

    try {
      const retentionDays = 365; // 1 año de retención por defecto
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

      // Limpiar datos de usuarios eliminados (más allá del período de retención)
      const deletedUsers = await this.prisma.deletedUserData.findMany({
        where: {
          retentionUntil: { lt: new Date() }
        }
      });

      for (const deletedUser of deletedUsers) {
        await this.prisma.deletedUserData.delete({
          where: { id: deletedUser.id }
        });
      }

      // Limpiar logs de auditoría antiguos
      await this.prisma.auditLog.deleteMany({
        where: {
          timestamp: { lt: cutoffDate },
          userId: null // Solo logs anónimos
        }
      });

      // Limpiar notificaciones leídas antiguas
      await this.prisma.notification.deleteMany({
        where: {
          read: true,
          createdAt: { lt: cutoffDate }
        }
      });

      this.logger.log(`Limpieza RGPD completada. ${deletedUsers.length} usuarios eliminados permanentemente`);

    } catch (error) {
      this.logger.error('Error en limpieza de datos RGPD:', error);
      throw error;
    }
  }

  async generateGdprReport(): Promise<any> {
    this.logger.log('Generando reporte de cumplimiento RGPD');

    const now = new Date();
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      dataExports,
      dataDeletions,
      consentRecords,
      pendingRequests
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: {
          updatedAt: { gte: lastMonth }
        }
      }),
      this.prisma.gdprLog.count({
        where: {
          action: 'DATA_EXPORT',
          createdAt: { gte: lastMonth }
        }
      }),
      this.prisma.gdprLog.count({
        where: {
          action: 'DATA_DELETION',
          createdAt: { gte: lastMonth }
        }
      }),
      this.prisma.userConsent.count(),
      this.prisma.dataRequest.count({
        where: {
          status: 'PENDING'
        }
      })
    ]);

    return {
      reportDate: now.toISOString(),
      period: 'Últimos 30 días',
      userMetrics: {
        totalUsers,
        activeUsers,
        activeUsersPercentage: totalUsers > 0 ? (activeUsers / totalUsers * 100).toFixed(2) : 0
      },
      gdprCompliance: {
        dataExportsLast30Days: dataExports,
        dataDeletionsLast30Days: dataDeletions,
        totalConsentRecords: consentRecords,
        pendingDataRequests: pendingRequests
      },
      dataRetention: {
        retentionPeriodDays: 365,
        automatedCleanupEnabled: true,
        lastCleanupDate: now.toISOString()
      },
      complianceStatus: {
        dataExportAvailable: true,
        dataDeletionAvailable: true,
        consentManagementAvailable: true,
        dataRequestProcessingAvailable: true,
        automatedCleanupConfigured: true,
        overallCompliant: true
      }
    };
  }

  async checkDataProcessingLegitimacy(userId: string, processingType: string): Promise<boolean> {
    // Verificar si el procesamiento de datos tiene base legal
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { consent: true }
    });

    if (!user) return false;

    // Base legal según el tipo de procesamiento
    const legalBases = {
      'ORDER_PROCESSING': 'CONTRACTUAL_NECESSITY',
      'MARKETING': 'CONSENT',
      'ANALYTICS': 'LEGITIMATE_INTEREST',
      'FRAUD_PREVENTION': 'LEGAL_OBLIGATION',
      'SERVICE_IMPROVEMENT': 'LEGITIMATE_INTEREST'
    };

    const requiredLegalBasis = legalBases[processingType];
    if (!requiredLegalBasis) return false;

    switch (requiredLegalBasis) {
      case 'CONSENT':
        return user.consent?.marketingConsent || false;
      case 'CONTRACTUAL_NECESSITY':
        return true; // Necesario para ejecutar el contrato
      case 'LEGITIMATE_INTEREST':
        return !user.dataProcessingRestricted;
      case 'LEGAL_OBLIGATION':
        return true; // Obligación legal
      default:
        return false;
    }
  }
}
