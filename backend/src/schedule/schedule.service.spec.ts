import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleService } from './schedule.service';
import { ScheduleRepository } from './schedule.repository';
import { RestaurantService } from './restaurant.service';
import { BadRequestException } from '@nestjs/common';

describe('ScheduleService Integration - Order Blocking', () => {
  let service: ScheduleService;
  let scheduleRepository: jest.Mocked<ScheduleRepository>;
  let restaurantService: jest.Mocked<RestaurantService>;

  const mockScheduleWindow = {
    id: 'w1',
    dayOfWeek: 1, // Lunes
    shift: 1,
    openTime: '09:00',
    closeTime: '14:00',
    active: true,
    note: 'Horario normal'
  };

  const mockSpecialSchedule = {
    id: 's1',
    date: '2026-12-25',
    openTime: '12:00',
    closeTime: '16:00',
    isClosed: false,
    note: 'Navidad'
  };

  const mockClosedSpecialSchedule = {
    id: 's2',
    date: '2026-12-25',
    isClosed: true,
    note: 'Cerrado por festivo'
  };

  beforeEach(async () => {
    const mockScheduleRepository = {
      findAllRegularSchedules: jest.fn(),
      findAllSpecialSchedules: jest.fn(),
      createScheduleWindow: jest.fn(),
      updateScheduleWindow: jest.fn(),
      deleteScheduleWindow: jest.fn(),
      createSpecialSchedule: jest.fn(),
      updateSpecialSchedule: jest.fn(),
      deleteSpecialSchedule: jest.fn(),
    };

    const mockRestaurantService = {
      getRestaurantHours: jest.fn(),
      getCurrentStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleService,
        { provide: ScheduleRepository, useValue: mockScheduleRepository },
        { provide: RestaurantService, useValue: mockRestaurantService },
      ],
    }).compile();

    service = module.get<ScheduleService>(ScheduleService);
    scheduleRepository = module.get(ScheduleRepository);
    restaurantService = module.get(RestaurantService);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('assertOpenForOrders - Bloqueo de Pedidos', () => {
    it('debería permitir pedidos cuando el restaurante está abierto', async () => {
      // Arrange
      const openHours = {
        regular: [mockScheduleWindow],
        special: [],
        isOpenNow: true,
        nextCloseTime: new Date('2026-05-05T14:00:00Z')
      };
      restaurantService.getRestaurantHours.mockResolvedValue(openHours);

      // Act
      const result = await service.assertOpenForOrders();

      // Assert
      expect(result).toEqual(openHours);
      expect(restaurantService.getRestaurantHours).toHaveBeenCalled();
    });

    it('debería bloquear pedidos cuando el restaurante está cerrado - sin próxima apertura', async () => {
      // Arrange
      const closedHours = {
        regular: [],
        special: [],
        isOpenNow: false,
        nextOpenTime: undefined
      };
      restaurantService.getRestaurantHours.mockResolvedValue(closedHours);

      // Act & Assert
      await expect(service.assertOpenForOrders()).rejects.toThrow(BadRequestException);
      await expect(service.assertOpenForOrders()).rejects.toThrow('No se pueden crear pedidos ahora: Restaurante cerrado');
    });

    it('debería bloquear pedidos cuando el restaurante está cerrado - con próxima apertura', async () => {
      // Arrange
      const nextOpenDate = new Date('2026-05-06T09:00:00Z');
      const closedHours = {
        regular: [mockScheduleWindow],
        special: [],
        isOpenNow: false,
        nextOpenTime: nextOpenDate
      };
      restaurantService.getRestaurantHours.mockResolvedValue(closedHours);

      // Act & Assert
      await expect(service.assertOpenForOrders()).rejects.toThrow(BadRequestException);
      await expect(service.assertOpenForOrders()).rejects.toThrow(
        expect.stringContaining('Cerrado. Próxima apertura:')
      );
    });

    it('debería bloquear pedidos en día especial cerrado', async () => {
      // Arrange
      const closedSpecialHours = {
        regular: [mockScheduleWindow],
        special: [mockClosedSpecialSchedule],
        isOpenNow: false,
        nextOpenTime: new Date('2026-05-06T09:00:00Z')
      };
      restaurantService.getRestaurantHours.mockResolvedValue(closedSpecialHours);

      // Act & Assert
      await expect(service.assertOpenForOrders()).rejects.toThrow(BadRequestException);
    });

    it('debería permitir pedidos en día especial con horario modificado', async () => {
      // Arrange
      const specialOpenHours = {
        regular: [mockScheduleWindow],
        special: [mockSpecialSchedule],
        isOpenNow: true,
        nextCloseTime: new Date('2026-12-25T16:00:00Z')
      };
      restaurantService.getRestaurantHours.mockResolvedValue(specialOpenHours);

      // Act
      const result = await service.assertOpenForOrders();

      // Assert
      expect(result).toEqual(specialOpenHours);
      expect(result.isOpenNow).toBe(true);
    });
  });

  describe('getPublicSchedule', () => {
    it('debería obtener horario público correctamente', async () => {
      // Arrange
      const publicHours = {
        regular: [mockScheduleWindow],
        special: [mockSpecialSchedule],
        isOpenNow: true,
        nextCloseTime: new Date('2026-05-05T14:00:00Z')
      };
      restaurantService.getRestaurantHours.mockResolvedValue(publicHours);

      // Act
      const result = await service.getPublicSchedule();

      // Assert
      expect(result).toEqual(publicHours);
      expect(restaurantService.getRestaurantHours).toHaveBeenCalled();
    });
  });

  describe('getAdminSchedule', () => {
    it('debería obtener horario completo para admin', async () => {
      // Arrange
      scheduleRepository.findAllRegularSchedules.mockResolvedValue([mockScheduleWindow]);
      scheduleRepository.findAllSpecialSchedules.mockResolvedValue([mockSpecialSchedule]);
      restaurantService.getCurrentStatus.mockResolvedValue({ status: 'OPEN', message: 'Operación normal' });

      // Act
      const result = await service.getAdminSchedule();

      // Assert
      expect(result).toEqual({
        regular: [mockScheduleWindow],
        special: [mockSpecialSchedule],
        currentStatus: { status: 'OPEN', message: 'Operación normal' }
      });
      expect(scheduleRepository.findAllRegularSchedules).toHaveBeenCalled();
      expect(scheduleRepository.findAllSpecialSchedules).toHaveBeenCalled();
      expect(restaurantService.getCurrentStatus).toHaveBeenCalled();
    });
  });

  describe('Escenarios reales de bloqueo', () => {
    it('debería bloquear pedidos a las 8am cuando abre a las 9am', async () => {
      // Arrange
      const earlyMorning = new Date('2026-05-05T08:30:00Z');
      jest.setSystemTime(earlyMorning);
      
      const closedHours = {
        regular: [mockScheduleWindow],
        special: [],
        isOpenNow: false,
        nextOpenTime: new Date('2026-05-05T09:00:00Z')
      };
      restaurantService.getRestaurantHours.mockResolvedValue(closedHours);

      // Act & Assert
      await expect(service.assertOpenForOrders()).rejects.toThrow(BadRequestException);
      await expect(service.assertOpenForOrders()).rejects.toThrow(
        expect.stringContaining('Próxima apertura')
      );
    });

    it('debería bloquear pedidos a las 3pm cuando cierra a las 2pm', async () => {
      // Arrange
      const afternoon = new Date('2026-05-05T15:00:00Z');
      jest.setSystemTime(afternoon);
      
      const afterHours = {
        regular: [mockScheduleWindow],
        special: [],
        isOpenNow: false,
        nextOpenTime: new Date('2026-05-06T09:00:00Z')
      };
      restaurantService.getRestaurantHours.mockResolvedValue(afterHours);

      // Act & Assert
      await expect(service.assertOpenForOrders()).rejects.toThrow(BadRequestException);
    });

    it('debería permitir pedidos durante horario de comida', async () => {
      // Arrange
      const lunchTime = new Date('2026-05-05T12:00:00Z');
      jest.setSystemTime(lunchTime);
      
      const lunchHours = {
        regular: [mockScheduleWindow],
        special: [],
        isOpenNow: true,
        nextCloseTime: new Date('2026-05-05T14:00:00Z')
      };
      restaurantService.getRestaurantHours.mockResolvedValue(lunchHours);

      // Act
      const result = await service.assertOpenForOrders();

      // Assert
      expect(result.isOpenNow).toBe(true);
    });
  });
});
