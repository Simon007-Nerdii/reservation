import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from '../services/schedule.service';
import { CreateAvailabilityDto } from '../dto/create-availability.dto';
import { CreateReservationDto } from '../dto/create-reservation.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ScheduleController', () => {
  let controller: ScheduleController;
  let service: ScheduleService;

  const mockService = {
    createAvailability: jest.fn(),
    getAvailableSlots: jest.fn(),
    createReservation: jest.fn(),
    confirmReservation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScheduleController],
      providers: [
        {
          provide: ScheduleService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ScheduleController>(ScheduleController);
    service = module.get<ScheduleService>(ScheduleService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createAvailability', () => {
    it('should create an availability for a provider', async () => {
      const dto: CreateAvailabilityDto = { date: '2024-08-13', startTime: '08:00', endTime: '15:00' };
      mockService.createAvailability.mockResolvedValue(dto);

      expect(await controller.createAvailability('Dr. Jekyll', dto)).toEqual(dto);
      expect(mockService.createAvailability).toHaveBeenCalledWith('Dr. Jekyll', dto);
    });

    it('should throw NotFoundException if provider is not found', async () => {
      const dto: CreateAvailabilityDto = { date: '2024-08-13', startTime: '08:00', endTime: '15:00' };
      mockService.createAvailability.mockRejectedValue(new NotFoundException('Provider not found'));

      await expect(controller.createAvailability('NonExistentProvider', dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAvailableSlots', () => {
    it('should return available slots for a provider', async () => {
      const slots = [{ slot1: '08:00-08:15' }];
      mockService.getAvailableSlots.mockResolvedValue(slots);

      expect(await controller.getAvailableSlots('Dr. Jekyll', '2024-08-13')).toEqual(slots);
      expect(mockService.getAvailableSlots).toHaveBeenCalledWith('Dr. Jekyll', '2024-08-13');
    });

    it('should throw NotFoundException if provider is not found', async () => {
      mockService.getAvailableSlots.mockRejectedValue(new NotFoundException('Provider not found'));

      await expect(controller.getAvailableSlots('NonExistentProvider', '2024-08-13')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createReservation', () => {
    it('should create a reservation for a client', async () => {
      const dto: CreateReservationDto = { date: '2024-08-15', timeSlot: '09:00', providerName: 'Dr. Jekyll', clientEmail: 'john@example.com' };
      mockService.createReservation.mockResolvedValue(dto);

      expect(await controller.createReservation(dto)).toEqual(dto);
      expect(mockService.createReservation).toHaveBeenCalledWith(dto);
    });

    it('should throw NotFoundException if provider is not found', async () => {
      const dto: CreateReservationDto = { date: '2024-08-15', timeSlot: '09:00', providerName: 'NonExistentProvider', clientEmail: 'john@example.com' };
      mockService.createReservation.mockRejectedValue(new NotFoundException('Provider not found'));

      await expect(controller.createReservation(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if reservation is not 24 hours in advance', async () => {
      const dto: CreateReservationDto = { date: '2024-08-15', timeSlot: '09:00', providerName: 'Dr. Jekyll', clientEmail: 'john@example.com' };
      mockService.createReservation.mockRejectedValue(new BadRequestException('Reservations must be made at least 24 hours in advance'));

      await expect(controller.createReservation(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if time slot is already reserved', async () => {
      const dto: CreateReservationDto = { date: '2024-08-15', timeSlot: '09:00', providerName: 'Dr. Jekyll', clientEmail: 'john@example.com' };
      mockService.createReservation.mockRejectedValue(new BadRequestException('This time slot is already reserved'));

      await expect(controller.createReservation(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('confirmReservation', () => {
    it('should confirm a reservation', async () => {
      const reservationId = 1;
      const confirmedReservation = { id: reservationId, confirmed: true };
      mockService.confirmReservation.mockResolvedValue(confirmedReservation);

      expect(await controller.confirmReservation(reservationId)).toEqual(confirmedReservation);
      expect(mockService.confirmReservation).toHaveBeenCalledWith(reservationId);
    });

    it('should throw NotFoundException if reservation is not found', async () => {
      const reservationId = 999;
      mockService.confirmReservation.mockRejectedValue(new NotFoundException('Reservation not found'));

      await expect(controller.confirmReservation(reservationId)).rejects.toThrow(NotFoundException);
    });
  });
});
