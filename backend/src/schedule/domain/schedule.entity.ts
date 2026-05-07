import { BadRequestException } from '@nestjs/common';

export class ScheduleDomain {
  static validateDayOfWeek(value: number) {
    if (value < 0 || value > 6) {
      throw new BadRequestException('dayOfWeek must be between 0 and 6');
    }
  }

  static validateTimeFormat(time: string) {
    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) {
      throw new BadRequestException('Time must use HH:mm format');
    }
  }

  static validateWindow(openTime: string, closeTime: string) {
    this.validateTimeFormat(openTime);
    this.validateTimeFormat(closeTime);
    if (openTime >= closeTime) {
      throw new BadRequestException('openTime must be before closeTime');
    }
  }

  static normalizeDate(date: Date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  }
}
