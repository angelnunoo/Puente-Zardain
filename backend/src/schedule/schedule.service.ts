/**
 * SCHEDULE SERVICE
 * Servicios para gestión de horarios (CRUD)
 * La lógica de validación y estado está en RestaurantService
 */

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ScheduleRepository } from './schedule.repository';
import { RestaurantService } from './restaurant.service';
import { ScheduleDomain } from './domain/schedule.domain';
import { ScheduleWindowDto, SpecialScheduleDto } from '../../../shared/dtos';
import { IScheduleWindow, ISpecialSchedule, IRestaurantHours } from '../../../shared/interfaces';
import { LogMethod } from '../common/decorators/log-method.decorator';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger('ScheduleService');

  constructor(
    private readonly scheduleRepository: ScheduleRepository,
    private readonly restaurantService: RestaurantService,
  ) {}

  // ==================== CONSULTAS PÚBLICAS ====================

  /**
   * Obtiene horarios públicos del restaurante para cliente
   */
  @LogMethod('public schedule')
  async getPublicSchedule(): Promise<IRestaurantHours> {
    return this.restaurantService.getRestaurantHours();
  }

  /**
   * Obtiene horarios para admin (con más detalles)
   */
  @LogMethod('admin schedule')
  async getAdminSchedule(): Promise<{
    regular: IScheduleWindow[];
    special: ISpecialSchedule[];
    currentStatus: any;
  }> {
    const [regular, special] = await Promise.all([
      this.scheduleRepository.findAllRegularSchedules(),
      this.scheduleRepository.findAllSpecialSchedules(),
    ]);

    const currentStatus = await this.restaurantService.getCurrentStatus();

    return {
      regular,
      special,
      currentStatus,
    };
  }

  // ==================== GESTIÓN DE HORARIOS REGULARES ====================

  /**
   * Crea un nuevo horario regular
   */
  @LogMethod('create schedule window')
  async createWindow(dto: ScheduleWindowDto): Promise<IScheduleWindow> {
    ScheduleDomain.validateWindow(dto);
    return this.scheduleRepository.createScheduleWindow(dto);
  }

  /**
   * Actualiza un horario regular
   */
  @LogMethod('update schedule window')
  async updateWindow(id: string, dto: Partial<ScheduleWindowDto>): Promise<IScheduleWindow> {
    ScheduleDomain.validateWindow(dto);
    return this.scheduleRepository.updateScheduleWindow(id, dto);
  }

  /**
   * Elimina un horario regular
   */
  @LogMethod('delete schedule window')
  async deleteWindow(id: string): Promise<IScheduleWindow> {
    return this.scheduleRepository.deleteScheduleWindow(id);
  }

  // ==================== GESTIÓN DE HORARIOS ESPECIALES ====================

  /**
   * Crea un nuevo horario especial (festivo, evento, cierre especial, etc.)
   */
  @LogMethod('create special schedule')
  async createSpecial(dto: SpecialScheduleDto): Promise<ISpecialSchedule> {
    ScheduleDomain.validateSpecialSchedule(dto as any);
    return this.scheduleRepository.createSpecialSchedule(dto);
  }

  /**
   * Actualiza un horario especial
   */
  @LogMethod('update special schedule')
  async updateSpecial(
    id: string,
    dto: Partial<SpecialScheduleDto>,
  ): Promise<ISpecialSchedule> {
    ScheduleDomain.validateSpecialSchedule(dto as any);
    return this.scheduleRepository.updateSpecialSchedule(id, dto);
  }

  /**
   * Elimina un horario especial
   */
  @LogMethod('delete special schedule')
  async deleteSpecial(id: string): Promise<ISpecialSchedule> {
    return this.scheduleRepository.deleteSpecialSchedule(id);
  }

  /**
   * Verifica que el restaurante esté abierto para pedidos
   */
  @LogMethod('assert open for orders')
  async assertOpenForOrders(): Promise<IRestaurantHours> {
    const schedule = await this.getPublicSchedule();
    if (!schedule.isOpenNow) {
      const reason = schedule.nextOpenTime
        ? `Cerrado. Próxima apertura: ${schedule.nextOpenTime.toLocaleString('es-ES')}`
        : 'Restaurante cerrado';
      throw new BadRequestException(`No se pueden crear pedidos ahora: ${reason}`);
    }
    return schedule;
  }
}
