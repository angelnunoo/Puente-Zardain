/**
 * RESTAURANT SERVICE
 * Lógica de negocio para horarios, estado y disponibilidad del restaurante
 * NÚCLEO DE FASE 2
 */

import { Injectable, Logger } from '@nestjs/common';
import { ScheduleRepository } from './schedule.repository';
import { RestaurantClosedException, OrderTooLateException } from '../common/exceptions/app.exception';
import {
  IRestaurantHours,
  IScheduleWindow,
  ISpecialSchedule,
} from '../../../shared/interfaces';
import { ShiftType } from '../../../shared/enums';

interface TimeRange {
  openTime: Date;
  closeTime: Date;
}

@Injectable()
export class RestaurantService {
  private readonly logger = new Logger('RestaurantService');
  private readonly MINIMUM_ADVANCE_TIME_MINUTES = 15; // Mínimo de minutos antes de cierre
  private readonly ESTIMATED_PREP_TIME_MINUTES = 45; // Tiempo estimado de preparación

  constructor(private scheduleRepository: ScheduleRepository) {}

  /**
   * Determina si el restaurante está abierto AHORA
   */
  async isOpenNow(): Promise<boolean> {
    const hoursInfo = await this.getRestaurantHours();
    return hoursInfo.isOpenNow;
  }

  /**
   * Obtiene información completa de horarios del restaurante
   */
  async getRestaurantHours(): Promise<IRestaurantHours> {
    const now = new Date();
    const today = now.getDay();
    const currentTime = this.timeToMinutes(now);

    const [regularSchedules, specialSchedules] = await Promise.all([
      this.scheduleRepository.findAllRegularSchedules(),
      this.scheduleRepository.findAllSpecialSchedules(),
    ]);

    // 1. Verificar si hay horario especial para hoy
    const specialToday = specialSchedules.find((s) => this.isSameDay(s.date, now));

    if (specialToday && specialToday.isClosed) {
      return {
        regular: regularSchedules,
        special: specialSchedules,
        isOpenNow: false,
        nextOpenTime: this.getNextOpeningAfterToday(
          now,
          regularSchedules,
          specialSchedules,
        ),
      };
    }

    // 2. Si hay horario especial, usarlo
    if (specialToday && (specialToday.openTime || specialToday.closeTime)) {
      const openTime = specialToday.openTime
        ? this.timeToMinutes(this.parseTime(specialToday.openTime))
        : 0;
      const closeTime = specialToday.closeTime
        ? this.timeToMinutes(this.parseTime(specialToday.closeTime))
        : 1440;

      const isOpen = currentTime >= openTime && currentTime < closeTime;

      return {
        regular: regularSchedules,
        special: specialSchedules,
        isOpenNow: isOpen,
        nextOpenTime: isOpen ? undefined : this.getNextOpening(now, regularSchedules, specialSchedules),
        nextCloseTime: isOpen
          ? this.addMinutesToDate(now, closeTime - currentTime)
          : undefined,
      };
    }

    // 3. Usar horarios regulares
    const todaySchedules = regularSchedules.filter((s) => s.dayOfWeek === today && s.active);

    if (todaySchedules.length === 0) {
      return {
        regular: regularSchedules,
        special: specialSchedules,
        isOpenNow: false,
        nextOpenTime: this.getNextOpening(now, regularSchedules, specialSchedules),
      };
    }

    // 4. Verificar si está abierto en alguno de los turnos del día
    let isOpenNow = false;
    let nextCloseTime: Date | undefined;

    for (const schedule of todaySchedules) {
      const openMinutes = this.timeToMinutes(this.parseTime(schedule.openTime));
      const closeMinutes = this.timeToMinutes(this.parseTime(schedule.closeTime));

      if (currentTime >= openMinutes && currentTime < closeMinutes) {
        isOpenNow = true;
        nextCloseTime = this.addMinutesToDate(now, closeMinutes - currentTime);
        break;
      }
    }

    return {
      regular: regularSchedules,
      special: specialSchedules,
      isOpenNow,
      nextOpenTime: !isOpenNow
        ? this.getNextOpening(now, regularSchedules, specialSchedules)
        : undefined,
      nextCloseTime,
    };
  }

  /**
   * Verifica si se puede hacer un pedido AHORA
   * Lanza excepción si no es posible
   */
  async validateOrderAllowed(): Promise<void> {
    const hoursInfo = await this.getRestaurantHours();

    if (!hoursInfo.isOpenNow) {
      const msg = hoursInfo.nextOpenTime
        ? `Restaurante cerrado. Abrimos el ${hoursInfo.nextOpenTime.toLocaleString('es-ES')}`
        : 'Restaurante cerrado. Sin horario disponible';

      throw new RestaurantClosedException(msg, {
        nextOpenTime: hoursInfo.nextOpenTime,
      });
    }

    // Verificar si hay tiempo mínimo antes del cierre
    if (hoursInfo.nextCloseTime) {
      const minutesUntilClose = Math.floor(
        (hoursInfo.nextCloseTime.getTime() - Date.now()) / (1000 * 60),
      );

      if (minutesUntilClose < this.MINIMUM_ADVANCE_TIME_MINUTES) {
        throw new OrderTooLateException(
          hoursInfo.nextCloseTime,
          this.MINIMUM_ADVANCE_TIME_MINUTES,
          {
            minutesUntilClose,
          },
        );
      }
    }
  }

  /**
   * Obtiene el tiempo estimado para un nuevo pedido
   */
  async getEstimatedDeliveryTime(): Promise<number> {
    // En futuras fases: considerar cola actual, predicciones, etc.
    // Por ahora: tiempo fijo
    return this.ESTIMATED_PREP_TIME_MINUTES;
  }

  /**
   * Obtiene el estado actual del restaurante para admin
   */
  async getCurrentStatus(): Promise<{
    open: boolean;
    reason: string;
    nextOpenTime?: Date;
    nextCloseTime?: Date;
  }> {
    const hoursInfo = await this.getRestaurantHours();

    return {
      open: hoursInfo.isOpenNow,
      reason: hoursInfo.isOpenNow ? 'Abierto' : 'Cerrado',
      nextOpenTime: hoursInfo.nextOpenTime,
      nextCloseTime: hoursInfo.nextCloseTime,
    };
  }

  /**
   * Obtiene el horario de apertura siguiente
   */
  private getNextOpening(
    now: Date,
    regularSchedules: IScheduleWindow[],
    specialSchedules: ISpecialSchedule[],
  ): Date | undefined {
    let searchDate = new Date(now);
    searchDate.setHours(0, 0, 0, 0);

    // Buscar en los próximos 60 días
    for (let i = 0; i < 60; i++) {
      const special = specialSchedules.find((s) => this.isSameDay(s.date, searchDate));

      // Si hay festivo cerrado, saltar
      if (special && special.isClosed) {
        searchDate.setDate(searchDate.getDate() + 1);
        continue;
      }

      // Si hay horario especial abierto, usar ese
      if (special && (special.openTime || special.closeTime)) {
        const openTime = special.openTime ? this.parseTime(special.openTime) : null;
        if (openTime) {
          openTime.setFullYear(searchDate.getFullYear());
          openTime.setMonth(searchDate.getMonth());
          openTime.setDate(searchDate.getDate());
          return openTime > now ? openTime : undefined;
        }
      }

      // Usar horarios regulares
      const dayOfWeek = searchDate.getDay();
      const daySchedules = regularSchedules.filter((s) => s.dayOfWeek === dayOfWeek && s.active);

      if (daySchedules.length > 0) {
        // Retornar la apertura del primer turno
        const firstShift = daySchedules.sort((a, b) => a.shift - b.shift)[0];
        const openTime = this.parseTime(firstShift.openTime);
        openTime.setFullYear(searchDate.getFullYear());
        openTime.setMonth(searchDate.getMonth());
        openTime.setDate(searchDate.getDate());
        return openTime;
      }

      searchDate.setDate(searchDate.getDate() + 1);
    }

    return undefined;
  }

  /**
   * Obtiene la apertura siguiente después de hoy
   */
  private getNextOpeningAfterToday(
    now: Date,
    regularSchedules: IScheduleWindow[],
    specialSchedules: ISpecialSchedule[],
  ): Date | undefined {
    let searchDate = new Date(now);
    searchDate.setDate(searchDate.getDate() + 1);
    searchDate.setHours(0, 0, 0, 0);

    return this.getNextOpening(searchDate, regularSchedules, specialSchedules);
  }

  // ==================== UTILIDADES ====================

  private isSameDay(date1: Date, date2: Date): boolean {
    const d1 = new Date(date1);
    d1.setHours(0, 0, 0, 0);
    const d2 = new Date(date2);
    d2.setHours(0, 0, 0, 0);
    return d1.getTime() === d2.getTime();
  }

  private timeToMinutes(date: Date): number {
    return date.getHours() * 60 + date.getMinutes();
  }

  private parseTime(timeString: string): Date {
    // Espera formato "HH:mm"
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  private addMinutesToDate(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60 * 1000);
  }
}
