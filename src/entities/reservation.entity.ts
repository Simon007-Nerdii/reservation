import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { Provider } from './provider.entity';
import { Client } from './client.entity';

@Entity()
export class Reservation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  date: string;

  @Column()
  timeSlot: string;

  @Column({ default: false })
  confirmed: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Provider)
  provider: Provider;

  @ManyToOne(() => Client)
  client: Client;
}
