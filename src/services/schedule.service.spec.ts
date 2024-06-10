import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleService } from './schedule.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Provider } from '../entities/provider.entity';
import { Client } from '../entities/client.entity';
import { Availability } from '../entities/availability.entity';
import { Reservation } from '../entities/reservation.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ScheduleService', () => {
  let service: ScheduleService;
  let providerRepository: Repository<Provider>;
  let clientRepository: Repository<Client>;
  let availabilityRepository: Repository<Availability>;
  let reservationRepository: Repository<Reservation>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Provider, Client, Availability, Reservation],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([Provider, Client, Availability, Reservation]),
      ],
      providers: [ScheduleService],
    }).compile();

    service = module.get<ScheduleService>(ScheduleService);
    providerRepository = module.get<Repository<Provider>>(getRepositoryToken(Provider));
    clientRepository = module.get<Repository<Client>>(getRepositoryToken(Client));
    availabilityRepository = module.get<Repository<Availability>>(getRepositoryToken(Availability));
    reservationRepository = module.get<Repository<Reservation>>(getRepositoryToken(Reservation));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAvailability', () => {
    it('should create an availability for a provider', async () => {
      const provider = await providerRepository.save({ name: 'Dr. Jekyll' });
      const dto = { date: '2024-08-13', startTime: '08:00', endTime: '15:00' };
      const availability = await service.createAvailability(provider.name, dto);
      expect(availability).toBeDefined();
      expect(availability.provider.id).toEqual(provider.id);
    });

    it('should throw NotFoundException if provider is not found', async () => {
      const dto = { date: '2024-08-13', startTime: '08:00', endTime: '15:00' };
      await expect(service.createAvailability('NonExistentProvider', dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAvailableSlots', () => {
    it('should return available slots for a provider', async () => {
      const provider = await providerRepository.save({ name: 'Dr. Jekyll' });
      await availabilityRepository.save({ provider, date: '2024-08-13', startTime: '08:00', endTime: '10:00' });
      const slots = await service.getAvailableSlots(provider.name, '2024-08-13');
      expect(slots).toBeDefined();
      expect(slots.length).toBeGreaterThan(0);
    });

    it('should throw NotFoundException if provider is not found', async () => {
      await expect(service.getAvailableSlots('NonExistentProvider', '2024-08-13')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createReservation', () => {
    it('should create a reservation for a client', async () => {
      const provider = await providerRepository.save({ name: 'Dr. Jekyll' });
      const client = await clientRepository.save({ name: 'John Doe', email: 'john@example.com' });
      const dto = { date: '2024-08-15', timeSlot: '09:00', providerName: provider.name, clientEmail: client.email };
      const reservation = await service.createReservation(dto);
      expect(reservation).toBeDefined();
      expect(reservation.provider.id).toEqual(provider.id);
      expect(reservation.client.id).toEqual(client.id);
    });

    it('should throw NotFoundException if provider is not found', async () => {
      const client = await clientRepository.save({ name: 'John Doe', email: 'john@example.com' });
      const dto = { date: '2024-08-15', timeSlot: '09:00', providerName: 'NonExistentProvider', clientEmail: client.email };
      await expect(service.createReservation(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if client is not found', async () => {
      const provider = await providerRepository.save({ name: 'Dr. Jekyll' });
      const dto = { date: '2024-08-15', timeSlot: '09:00', providerName: provider.name, clientEmail: 'nonexistent@example.com' };
      await expect(service.createReservation(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if reservation is not 24 hours in advance', async () => {
      const provider = await providerRepository.save({ name: 'Dr. Jekyll' });
      const client = await clientRepository.save({ name: 'John Doe', email: 'john@example.com' });
      const now = new Date();
      const date = now.toISOString().split('T')[0]; // today's date
      const timeSlot = `${now.getHours()}:${now.getMinutes()}`; // current time
      const dto = { date, timeSlot, providerName: provider.name, clientEmail: client.email };
      await expect(service.createReservation(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if time slot is already reserved', async () => {
      const provider = await providerRepository.save({ name: 'Dr. Jekyll' });
      const client = await clientRepository.save({ name: 'John Doe', email: 'john@example.com' });
      const dto = { date: '2024-08-15', timeSlot: '09:00', providerName: provider.name, clientEmail: client.email, confirmed: true };
      await service.createReservation(dto); // create the first reservation
      await expect(service.createReservation(dto)).rejects.toThrow(BadRequestException); // try to create another one for the same slot
    });
  });

  describe('confirmReservation', () => {
    it('should confirm a reservation', async () => {
      const provider = await providerRepository.save({ name: 'Dr. Jekyll' });
      const client = await clientRepository.save({ name: 'John Doe', email: 'john@example.com' });
      const reservation = await reservationRepository.save({ provider, client, date: '2024-08-15', timeSlot: '09:00' });
      const confirmedReservation = await service.confirmReservation(reservation.id);
      expect(confirmedReservation.confirmed).toBe(true);
    });

    it('should throw NotFoundException if reservation is not found', async () => {
      await expect(service.confirmReservation(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('handleExpiredReservations', () => {
    it('should remove expired reservations', async () => {
      const provider = await providerRepository.save({ name: 'Dr. Jekyll' });
      const client = await clientRepository.save({ name: 'John Doe', email: 'john@example.com' });
      const reservation = await reservationRepository.save({ provider, client, date: '2024-08-15', timeSlot: '09:00', createdAt: new Date(Date.now() - 31 * 60 * 1000) });
      await service.handleExpiredReservations();
      const expiredReservation = await reservationRepository.findOne({ where: { id: reservation.id } });
      expect(expiredReservation).toBeNull();
    });
  });
});
