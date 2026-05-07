import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleService } from './schedule.service';
import { ScheduleRepository } from './schedule.repository';
import { BadRequestException } from '@nestjs/common';

describe('ScheduleService', () => {
  let service: ScheduleService;
  const mockScheduleRepository = {
    getWeeklyWindows: jest.fn(),
    getSpecialSchedules: jest.fn(),
    createWindow: jest.fn(),
    updateWindow: jest.fn(),
    deleteWindow: jest.fn(),
    createSpecial: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleService,
        { provide: ScheduleRepository, useValue: mockScheduleRepository },
      ],
    }).compile();

    service = module.get<ScheduleService>(ScheduleService);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('should report open status when current time is within a scheduled window', async () => {
    const now = new Date('2026-05-05T12:00:00Z');
    jest.setSystemTime(now);
    mockScheduleRepository.getWeeklyWindows.mockResolvedValue([
      { id: 'w1', dayOfWeek: 2, shift: 1, openTime: '11:00', closeTime: '14:00', active: true },
    ]);
    mockScheduleRepository.getSpecialSchedules.mockResolvedValue([]);

    const schedule = await service.getPublicSchedule();
    expect(schedule.status.open).toBe(true);
    expect(schedule.status.reason).toContain('Abierto');
  });

  it('should report closed status for a special closed day', async () => {
    const now = new Date('2026-05-05T12:00:00Z');
    jest.setSystemTime(now);
    mockScheduleRepository.getWeeklyWindows.mockResolvedValue([]);
    mockScheduleRepository.getSpecialSchedules.mockResolvedValue([
      { id: 's1', date: '2026-05-05T00:00:00.000Z', isClosed: true },
    ]);

    const schedule = await service.getPublicSchedule();
    expect(schedule.status.open).toBe(false);
    expect(schedule.status.reason).toContain('Cerrado por día especial');
  });

  it('should reject order creation when the schedule is closed', async () => {
    const now = new Date('2026-05-05T08:00:00Z');
    jest.setSystemTime(now);
    mockScheduleRepository.getWeeklyWindows.mockResolvedValue([]);
    mockScheduleRepository.getSpecialSchedules.mockResolvedValue([]);

    await expect(service.assertOpenForOrders()).rejects.toBeInstanceOf(BadRequestException);
  });
});
