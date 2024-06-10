import { IsNotEmpty, IsString, IsInt } from 'class-validator';

export class CreateReservationDto {
  @IsNotEmpty()
  @IsString()
  date: string;

  @IsNotEmpty()
  @IsString()
  timeSlot: string;

  @IsNotEmpty()
  @IsInt()
  providerName: string;

  @IsNotEmpty()
  @IsInt()
  clientEmail: string;
}
