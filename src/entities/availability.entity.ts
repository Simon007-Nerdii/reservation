import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Provider } from './provider.entity';

@Entity()
export class Availability {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  date: string; // YYYY-MM-DD

  @Column()
  startTime: string; // HH:mm

  @Column()
  endTime: string; // HH:mm

  @ManyToOne(() => Provider, provider => provider.availabilities)
  provider: Provider;
}
