import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Provider } from '../entities/provider.entity';
import { Availability } from '../entities/availability.entity';
import { Reservation } from '../entities/reservation.entity';
import { Client } from '../entities/client.entity';
import { CreateAvailabilityDto } from '../dto/create-availability.dto';
import { CreateReservationDto } from '../dto/create-reservation.dto';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(Provider)
    private providerRepository: Repository<Provider>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(Availability)
    private availabilityRepository: Repository<Availability>,
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
  ) {}

  async createAvailability(providerName: string, dto: CreateAvailabilityDto): Promise<Availability> {
    const provider = await this.providerRepository.findOne({ where: { name: providerName } });
    if (!provider) {
      throw new NotFoundException(`Provider with name ${providerName} not found`);
    }
    const availability = this.availabilityRepository.create({ ...dto, provider });
    return this.availabilityRepository.save(availability);
  }

  async getAvailableSlots(providerName: string, date: string): Promise<{ [key: string]: string }[]> {
    const provider = await this.providerRepository.findOne({ where: { name: providerName } });
    if (!provider) {
      throw new NotFoundException(`Provider with name ${providerName} not found`);
    }
  
    const availabilities = await this.availabilityRepository.find({ where: { provider: { id: provider.id }, date } });
    const reservations = await this.reservationRepository.find({ where: { provider: { id: provider.id }, date } });
  
    const reservedSlots = reservations
      .filter(reservation => reservation.confirmed || this.isReservationActive(reservation.createdAt))
      .map(reservation => reservation.timeSlot);
    const availableSlots: { [key: string]: string }[] = [];
  
    let slotCounter = 1;
    for (const availability of availabilities) {
      const start = this.convertTimeToMinutes(availability.startTime);
      const end = this.convertTimeToMinutes(availability.endTime);
  
      for (let time = start; time < end; time += 15) {
        const slotStart = this.convertMinutesToTime(time);
        const slotEnd = this.convertMinutesToTime(time + 15);
        const slot = `${slotStart}-${slotEnd}`;
  
        if (!reservedSlots.includes(slotStart) && this.isSlotInFuture(date, slotStart)) {
          availableSlots.push({ [`slot${slotCounter}`]: slot });
          slotCounter++;
        }
      }
    }
  
    return availableSlots;
  }
  

  async createReservation(dto: CreateReservationDto): Promise<Reservation> {
    const provider = await this.providerRepository.findOne({ where: { name: dto.providerName } });
    const client = await this.clientRepository.findOne({ where: { email: dto.clientEmail } });
    if (!provider) {
      throw new NotFoundException(`Provider with ID ${dto.providerName} not found`);
    }
    if (!client) {
      throw new NotFoundException(`Client with ID ${dto.clientEmail} not found`);
    }
  
    // Ensure the reservation is made at least 24 hours in advance
    if (!this.isAtLeast24HoursInAdvance(dto.date, dto.timeSlot)) {
      throw new BadRequestException('Reservations must be made at least 24 hours in advance');
    }
  
     // Check if the slot is already reserved
    const existingReservation = await this.reservationRepository.findOne({
    where: {
      provider: { name: dto.providerName },
      date: dto.date,
      timeSlot: dto.timeSlot,
      confirmed: true,
    },
    });

  if (existingReservation) {
    throw new BadRequestException('This time slot is already reserved');
  }
    const reservation = this.reservationRepository.create({ ...dto, provider, client });
    return this.reservationRepository.save(reservation);
  }

  async confirmReservation(reservationId: number): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({ where: { id: reservationId } });
    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${reservationId} not found`);
    }
    reservation.confirmed = true;
    return this.reservationRepository.save(reservation);
  }

  // Additional logic for expiring reservations, etc.
  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleExpiredReservations() {
    const expiryTime = new Date(Date.now() - 30 * 60 * 1000);
    // const expiryTime = new Date(Date.now() - 1 * 60 * 1000); // 1 minute for testing
    const expiredReservations = await this.reservationRepository.find({
      where: {
        confirmed: false,
        createdAt: LessThan(expiryTime),
      },
    });

    await this.reservationRepository.remove(expiredReservations);
  }

  private convertTimeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private convertMinutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private isSlotInFuture(date: string, time: string): boolean {
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    const slotDate = new Date(year, month - 1, day, hours, minutes);
    const now = new Date();
    return slotDate > now;
  }

  private isAtLeast24HoursInAdvance(date: string, time: string): boolean {
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    const reservationDate = new Date(year, month - 1, day, hours, minutes);
    const now = new Date();
    const hoursDifference = (reservationDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursDifference >= 24;
  }

  private isReservationActive(createdAt: Date): boolean {
    const now = new Date();
    const expiryTime = new Date(createdAt);
    expiryTime.setMinutes(expiryTime.getMinutes() + 30);
    return now < expiryTime;
  }
}
