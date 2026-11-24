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

/** A community announcement posted by admins/officials (SenTri feature). */
@Entity('announcements')
export class Announcement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'boolean', default: true })
  is_published: boolean;

  /** Every announcement is posted by exactly one user (many-to-one). */
  @ManyToOne(() => User, (user) => user.announcements, { nullable: false })
  @JoinColumn({ name: 'posted_by' })
  posted_by: User;

  @Column({ name: 'posted_by' })
  posted_by_id: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
