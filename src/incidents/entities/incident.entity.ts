import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Zone } from '../../zones/entities/zone.entity';

export enum IncidentStatus {
  REPORTED = 'reported',
  VERIFIED = 'verified',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
}

export enum IncidentSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/** A community-submitted safety incident report (core of the SenTri system). */
@Entity('incidents')
export class Incident {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 50 })
  category: string; // e.g. theft, fire, accident, suspicious_activity

  @Column({
    type: 'enum',
    enum: IncidentStatus,
    default: IncidentStatus.REPORTED,
  })
  status: IncidentStatus;

  @Column({
    type: 'enum',
    enum: IncidentSeverity,
    default: IncidentSeverity.MEDIUM,
  })
  severity: IncidentSeverity;

  @Column({ type: 'varchar', length: 255 })
  location: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  /** Every incident happens in exactly one zone (many-to-one). */
  @ManyToOne(() => Zone, (zone) => zone.incidents, { nullable: false })
  @JoinColumn({ name: 'zone_id' })
  zone: Zone;

  @Column({ name: 'zone_id' })
  zone_id: number;

  /** Every incident is reported by exactly one user (many-to-one). */
  @ManyToOne(() => User, (user) => user.incidents, { nullable: false })
  @JoinColumn({ name: 'reported_by' })
  reported_by: User;

  @Column({ name: 'reported_by' })
  reported_by_id: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
