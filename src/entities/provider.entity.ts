import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Availability } from './availability.entity';

@Entity()
export class Provider {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => Availability, availability => availability.provider)
  availabilities: Availability[];
}
