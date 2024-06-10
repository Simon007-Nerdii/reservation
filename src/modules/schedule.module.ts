import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleController } from '../controllers/schedule.controller';
import { ScheduleService } from '../services/schedule.service';
import { Provider } from '../entities/provider.entity';
import { Client } from '../entities/client.entity';
import { Availability } from '../entities/availability.entity';
import { Reservation } from '../entities/reservation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Provider, Client, Availability, Reservation])],
  controllers: [ScheduleController],
  providers: [ScheduleService],
})
export class ScheduleModule {}
