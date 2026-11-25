import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Department } from '../../departments/entities/department.entity';
import { LeaveRequest } from '../../leave-requests/entities/leave-request.entity';

export enum EmployeeStatus {
  ACTIVE = 'active',
  PROBATION = 'probation',
  RESIGNED = 'resigned',
}

/** An employee record managed by the HRIS (core of the system). */
@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 120 })
  full_name: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 100 })
  position: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  salary: number;

  @Column({ type: 'date' })
  hire_date: string;

  @Column({
    type: 'enum',
    enum: EmployeeStatus,
    default: EmployeeStatus.PROBATION,
  })
  status: EmployeeStatus;

  /** Every employee belongs to exactly one department (many-to-one). */
  @ManyToOne(() => Department, (department) => department.employees, {
    nullable: false,
  })
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @Column({ name: 'department_id' })
  department_id: number;

  @OneToMany(() => LeaveRequest, (leave) => leave.employee)
  leave_requests: LeaveRequest[];

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
