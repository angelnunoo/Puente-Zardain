import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IncidenceType } from '../../../../shared/enums';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class IncidentsService {
  private readonly logger = new Logger('IncidentsService');

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService
  ) {}

  async createIncident(data: {
    userId: string;
    orderId?: string;
    type: IncidenceType;
    description: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    attachments?: string[];
  }) {
    const incident = await this.prisma.incidence.create({
      data: {
        userId: data.userId,
        orderId: data.orderId,
        type: data.type,
        description: data.description,
        priority: data.priority || 'MEDIUM',
        status: 'OPEN',
        attachments: data.attachments || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        order: {
          select: {
            id: true,
            total: true,
            status: true,
            createdAt: true,
          }
        }
      }
    });

    // Notificar al staff sobre nueva incidencia
    this.notificationsService.sendError(
      `Nueva Incidencia: ${data.type}`,
      `Usuario ${incident.user.name} ha reportado: ${data.description}`,
      ['admin', 'staff']
    );

    // Notificar al usuario sobre confirmación de incidencia
    this.notificationsService.sendOrderUpdate(
      incident.id,
      'INCIDENT_CREATED',
      'Hemos recibido tu incidencia y la estamos procesando',
      incident.userId
    );

    this.logger.log(`Incident created: ${incident.id} by user ${data.userId}`);
    return incident;
  }

  async getIncidents(filters: {
    status?: string;
    type?: IncidenceType;
    priority?: string;
    userId?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { page = 1, limit = 20, ...otherFilters } = filters;
    const skip = (page - 1) * limit;

    const where = {
      ...otherFilters,
      ...(filters.userId && { userId: filters.userId }),
      ...(filters.status && { status: filters.status }),
      ...(filters.type && { type: filters.type }),
      ...(filters.priority && { priority: filters.priority }),
    };

    const [incidents, total] = await Promise.all([
      this.prisma.incidence.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            }
          },
          order: {
            select: {
              id: true,
              total: true,
              status: true,
              createdAt: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit,
      }),
      this.prisma.incidence.count({ where })
    ]);

    return {
      incidents,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getIncidentById(id: string) {
    const incident = await this.prisma.incidence.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        order: {
          select: {
            id: true,
            total: true,
            status: true,
            createdAt: true,
            items: {
              include: {
                product: true
              }
            }
          }
        }
      }
    });

    if (!incident) {
      throw new Error('Incident not found');
    }

    return incident;
  }

  async updateIncidentStatus(id: string, status: string, adminNotes?: string) {
    const incident = await this.prisma.incidence.update({
      where: { id },
      data: {
        status,
        adminNotes,
        updatedAt: new Date(),
        resolvedAt: status === 'RESOLVED' ? new Date() : undefined,
      },
      include: {
        user: true
      }
    });

    // Notificar al usuario sobre actualización
    const statusMessages = {
      'IN_PROGRESS': 'Tu incidencia está siendo procesada',
      'RESOLVED': 'Tu incidencia ha sido resuelta',
      'CLOSED': 'Tu incidencia ha sido cerrada',
      'REJECTED': 'Tu incidencia ha sido rechazada'
    };

    const message = statusMessages[status as keyof typeof statusMessages] || 'Tu incidencia ha sido actualizada';
    
    this.notificationsService.sendOrderUpdate(
      id,
      'INCIDENT_UPDATED',
      message,
      incident.userId
    );

    this.logger.log(`Incident ${id} updated to status: ${status}`);
    return incident;
  }

  async addIncidentResponse(id: string, response: {
    message: string;
    isInternal?: boolean;
    attachments?: string[];
  }) {
    const incident = await this.prisma.incidence.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        updatedAt: new Date(),
        responses: {
          create: {
            message: response.message,
            isInternal: response.isInternal || false,
            attachments: response.attachments || [],
            createdAt: new Date(),
          }
        }
      },
      include: {
        user: true
      }
    });

    // Notificar al usuario sobre nueva respuesta
    if (!response.isInternal) {
      this.notificationsService.sendOrderUpdate(
        id,
        'INCIDENT_RESPONSE',
        'Hay una nueva respuesta en tu incidencia',
        incident.userId
      );
    }

    this.logger.log(`Response added to incident ${id}`);
    return incident;
  }

  async getIncidentStats(startDate?: Date, endDate?: Date) {
    const dateFilter = {
      createdAt: {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate })
      }
    };

    const [
      totalIncidents,
      incidentsByType,
      incidentsByStatus,
      incidentsByPriority,
      resolutionTime
    ] = await Promise.all([
      this.prisma.incidence.count({ where: dateFilter }),
      
      this.prisma.incidence.groupBy({
        by: ['type'],
        where: dateFilter,
        _count: { type: true }
      }),
      
      this.prisma.incidence.groupBy({
        by: ['status'],
        where: dateFilter,
        _count: { status: true }
      }),
      
      this.prisma.incidence.groupBy({
        by: ['priority'],
        where: dateFilter,
        _count: { priority: true }
      }),
      
      this.prisma.incidence.aggregate({
        where: {
          ...dateFilter,
          resolvedAt: { not: null }
        },
        _avg: {
          resolvedAt: true
        }
      })
    ]);

    const averageResolutionTime = resolutionTime._avg.resolvedAt 
      ? this.calculateAverageResolutionTime(startDate || new Date(), resolutionTime._avg.resolvedAt)
      : null;

    return {
      totalIncidents,
      incidentsByType: incidentsByType.map(item => ({
        type: item.type,
        count: item._count.type
      })),
      incidentsByStatus: incidentsByStatus.map(item => ({
        status: item.status,
        count: item._count.status
      })),
      incidentsByPriority: incidentsByPriority.map(item => ({
        priority: item.priority,
        count: item._count.priority
      })),
      averageResolutionTime
    };
  }

  async escalateIncident(id: string, reason: string) {
    const incident = await this.prisma.incidence.update({
      where: { id },
      data: {
        priority: 'URGENT',
        status: 'ESCALATED',
        escalationReason: reason,
        escalatedAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        user: true
      }
    });

    // Notificar a administradores sobre escalada
    this.notificationsService.sendError(
      'INCIDENCIA ESCALADA',
      `Incidencia ${id} escalada por: ${reason}`,
      ['admin']
    );

    this.logger.warn(`Incident ${id} escalated: ${reason}`);
    return incident;
  }

  async autoCloseInactiveIncidents(hoursInactive: number = 72) {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hoursInactive);

    const inactiveIncidents = await this.prisma.incidence.updateMany({
      where: {
        status: 'OPEN',
        updatedAt: {
          lt: cutoffTime
        }
      },
      data: {
        status: 'CLOSED',
        adminNotes: 'Cerrado automáticamente por inactividad',
        resolvedAt: new Date(),
        updatedAt: new Date(),
      }
    });

    this.logger.log(`Auto-closed ${inactiveIncidents.count} inactive incidents`);
    return inactiveIncidents;
  }

  private calculateAverageResolutionTime(startDate: Date, avgDate: Date): string {
    const diffMs = avgDate.getTime() - startDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} días ${diffHours % 24} horas`;
    }
    return `${diffHours} horas`;
  }
}
