import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Incident } from '../../incidents/entities/incident.entity';
import { Announcement } from '../../announcements/entities/announcement.entity';

export enum UserRole {
  ADMIN = 'admin',
  OFFICIAL = 'official',
  RESIDENT = 'resident',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 120 })
  full_name: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, select: false })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.RESIDENT,
  })
  role: UserRole;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @OneToMany(() => Incident, (incident) => incident.reported_by)
  incidents: Incident[];

  @OneToMany(() => Announcement, (announcement) => announcement.posted_by)
  announcements: Announcement[];

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
