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
import { Employee } from '../../employees/entities/employee.entity';
import { User } from '../../users/entities/user.entity';

export enum LeaveType {
  SICK = 'sick',
  VACATION = 'vacation',
  EMERGENCY = 'emergency',
  UNPAID = 'unpaid',
}

export enum LeaveStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

/** A leave request filed by an employee and reviewed by HR (workflow module). */
@Entity('leave_requests')
@Index(['employee_id', 'status'])
export class LeaveRequest {
  @PrimaryGeneratedColumn()
  id: number;

  /** Every leave request belongs to exactly one employee (many-to-one). */
  @ManyToOne(() => Employee, (employee) => employee.leave_requests, {
    nullable: false,
  })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ name: 'employee_id' })
  employee_id: number;

  @Column({ type: 'enum', enum: LeaveType })
  leave_type: LeaveType;

  @Column({ type: 'date' })
  start_date: string;

  @Column({ type: 'date' })
  end_date: string;

  @Column({ type: 'text' })
  reason: string;

  @Column({
    type: 'enum',
    enum: LeaveStatus,
    default: LeaveStatus.PENDING,
  })
  status: LeaveStatus;

  /** Which HR/admin user reviewed this request (null until reviewed). */
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reviewed_by' })
  reviewed_by?: User;

  @Column({ name: 'reviewed_by', type: 'int', nullable: true })
  reviewed_by_id?: number;

  @Column({ type: 'datetime', nullable: true, name: 'reviewed_at' })
  reviewed_at?: Date;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
