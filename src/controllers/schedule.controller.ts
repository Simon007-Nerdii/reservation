import { Controller, Post, Body, Param, Get, Query } from '@nestjs/common';
import { ScheduleService } from '../services/schedule.service';
import { CreateAvailabilityDto } from '../dto/create-availability.dto';
import { CreateReservationDto } from '../dto/create-reservation.dto';
import { ApiBody, ApiTags } from '@nestjs/swagger';

@Controller('schedule')
@ApiTags('Schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post('provider/:name/availability')
  @ApiBody({
    description: 'Submit times providers are available for appointments',
    schema: {
      example: {
        date: '2024-08-13',
        startTime: '08:00',
        endTime: '15:00',
      },
    },
  })
  createAvailability(
    @Param('name') providerName: string,
    @Body() createAvailabilityDto: CreateAvailabilityDto,
  ) {
    return this.scheduleService.createAvailability(providerName, createAvailabilityDto);
  }

  @Get('provider/:name/available-slots')
  getAvailableSlots(
    @Param('name') providerName: string,
    @Query('date') date: string,
  ) {
    return this.scheduleService.getAvailableSlots(providerName, date);
  }

  @Post('reservation')
  @ApiBody({
    description: 'Reserve an available appointment slot',
    schema: {
      example: {
        date: '2024-08-13',
        timeSlot: '09:00',
        providerName: 'Dr. Jekyll',
        clientEmail: 'john@example.com',
      },
    },
  })
  createReservation(@Body() createReservationDto: CreateReservationDto) {
    return this.scheduleService.createReservation(createReservationDto);
  }

  @Post('reservation/:reservationId/confirm')
  confirmReservation(@Param('reservationId') reservationId: number) {
    return this.scheduleService.confirmReservation(reservationId);
  }
}
