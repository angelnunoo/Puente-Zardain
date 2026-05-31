/**
 * SCHEDULE REPOSITORY
 * Acceso a datos de horarios desde la base de datos
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScheduleWindowDto, SpecialScheduleDto } from '../../../shared/dtos';
import { IScheduleWindow, ISpecialSchedule } from '../../../shared/interfaces';

@Injectable()
export class ScheduleRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== HORARIOS REGULARES ====================

  async findAllRegularSchedules(): Promise<IScheduleWindow[]> {
    return this.prisma.scheduleWindow.findMany({
      orderBy: [{ dayOfWeek: 'asc' }, { shift: 'asc' }],
    });
  }

  async findByDayAndShift(dayOfWeek: number, shift: number): Promise<IScheduleWindow | null> {
    return this.prisma.scheduleWindow.findFirst({
      where: { dayOfWeek, shift },
    });
  }

  async createScheduleWindow(data: ScheduleWindowDto): Promise<IScheduleWindow> {
    return this.prisma.scheduleWindow.create({
      data: {
        dayOfWeek: data.dayOfWeek,
        shift: data.shift,
        openTime: data.openTime,
        closeTime: data.closeTime,
        active: data.active,
        note: data.note,
      },
    });
  }

  async updateScheduleWindow(
    id: string,
    data: Partial<ScheduleWindowDto>,
  ): Promise<IScheduleWindow> {
    return this.prisma.scheduleWindow.update({
      where: { id },
      data: {
        dayOfWeek: data.dayOfWeek,
        shift: data.shift,
        openTime: data.openTime,
        closeTime: data.closeTime,
        active: data.active,
        note: data.note,
      },
    });
  }

  async deleteScheduleWindow(id: string): Promise<IScheduleWindow> {
    return this.prisma.scheduleWindow.delete({
      where: { id },
    });
  }

  // ==================== HORARIOS ESPECIALES ====================

  async findAllSpecialSchedules(): Promise<ISpecialSchedule[]> {
    return this.prisma.specialSchedule.findMany({
      orderBy: { date: 'asc' },
    });
  }

  async findSpecialScheduleByDate(date: Date): Promise<ISpecialSchedule | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.specialSchedule.findFirst({
      where: {
        date: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });
  }

  async findUpcomingSpecialSchedules(days: number = 30): Promise<ISpecialSchedule[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + days);

    return this.prisma.specialSchedule.findMany({
      where: {
        date: {
          gte: today,
          lte: futureDate,
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  async createSpecialSchedule(data: SpecialScheduleDto): Promise<ISpecialSchedule> {
    const date = new Date(data.date);
    date.setHours(0, 0, 0, 0);

    return this.prisma.specialSchedule.create({
      data: {
        date,
        openTime: data.openTime,
        closeTime: data.closeTime,
        isClosed: data.isClosed,
        note: data.note,
      },
    });
  }

  async updateSpecialSchedule(
    id: string,
    data: Partial<SpecialScheduleDto>,
  ): Promise<ISpecialSchedule> {
    const updateData: any = {};
    if (data.date) {
      const date = new Date(data.date);
      date.setHours(0, 0, 0, 0);
      updateData.date = date;
    }
    if (data.openTime) updateData.openTime = data.openTime;
    if (data.closeTime) updateData.closeTime = data.closeTime;
    if (data.isClosed !== undefined) updateData.isClosed = data.isClosed;
    if (data.note) updateData.note = data.note;

    return this.prisma.specialSchedule.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteSpecialSchedule(id: string): Promise<ISpecialSchedule> {
    return this.prisma.specialSchedule.delete({
      where: { id },
    });
  }
}
