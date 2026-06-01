import { BadRequestException } from '@nestjs/common';
import { DayOfWeek, ShiftType } from '../../../../shared/enums';
import { IScheduleWindow, ISpecialSchedule } from '../../../../shared/interfaces';

type SpecialScheduleInput = Partial<Omit<ISpecialSchedule, 'date'> & { date?: string | Date }>;

export class ScheduleDomain {
  /**
   * Validates a schedule window
   */
  static validateWindow(window: Partial<IScheduleWindow>): void {
    if (window.dayOfWeek !== undefined && (window.dayOfWeek < 0 || window.dayOfWeek > 6)) {
      throw new BadRequestException('Invalid day of week. Must be 0-6 (Sunday-Saturday)');
    }

    if (window.openTime && window.closeTime) {
      if (!this.isValidTime(window.openTime) || !this.isValidTime(window.closeTime)) {
        throw new BadRequestException('Invalid time format. Use HH:MM format');
      }

      if (window.openTime >= window.closeTime) {
        throw new BadRequestException('Open time must be before close time');
      }
    }

    if (window.shift && !Object.values(ShiftType).includes(window.shift)) {
      throw new BadRequestException('Invalid shift type');
    }
  }

  /**
   * Validates a special schedule
   */
  static validateSpecialSchedule(schedule: SpecialScheduleInput): void {
    if (schedule.date) {
      const date = new Date(schedule.date);
      if (isNaN(date.getTime())) {
        throw new BadRequestException('Invalid date format');
      }
    }

    if (schedule.openTime && !this.isValidTime(schedule.openTime)) {
      throw new BadRequestException('Invalid open time format');
    }

    if (schedule.closeTime && !this.isValidTime(schedule.closeTime)) {
      throw new BadRequestException('Invalid close time format');
    }

    if (schedule.openTime && schedule.closeTime && schedule.openTime >= schedule.closeTime) {
      throw new BadRequestException('Open time must be before close time');
    }

    // If closed, times should be null
    if (schedule.isClosed && (schedule.openTime || schedule.closeTime)) {
      throw new BadRequestException('Closed schedules cannot have open/close times');
    }
  }

  /**
   * Checks if a time string is valid (HH:MM format)
   */
  private static isValidTime(time: string): boolean {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return timeRegex.test(time);
  }

  /**
   * Validates day of week
   */
  static validateDayOfWeek(day: number): void {
    if (day < 0 || day > 6) {
      throw new BadRequestException('Day of week must be 0-6');
    }
  }

  /**
   * Gets day name from number
   */
  static getDayName(day: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day] || 'Unknown';
  }

  /**
   * Checks if two windows overlap
   */
  static windowsOverlap(window1: IScheduleWindow, window2: IScheduleWindow): boolean {
    if (window1.dayOfWeek !== window2.dayOfWeek || window1.shift !== window2.shift) {
      return false;
    }

    return !(window1.closeTime <= window2.openTime || window2.closeTime <= window1.openTime);
  }
}