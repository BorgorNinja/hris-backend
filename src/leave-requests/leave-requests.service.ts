import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  LeaveRequest,
  LeaveStatus,
} from './entities/leave-request.entity';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { Employee } from '../employees/entities/employee.entity';

@Injectable()
export class LeaveRequestsService {
  constructor(
    @InjectRepository(LeaveRequest)
    private readonly leaveRequestsRepository: Repository<LeaveRequest>,
    @InjectRepository(Employee)
    private readonly employeesRepository: Repository<Employee>,
  ) {}

  /**
   * File a leave request. Employees can only file for themselves;
   * HR/Admin may file on behalf of any employee (dto.employee_id).
   */
  async create(dto: CreateLeaveRequestDto, requester: User): Promise<LeaveRequest> {
    let employeeId = dto.employee_id;

    if (requester.role === UserRole.EMPLOYEE) {
      // Row-level rule: an employee's account maps to their own employee record.
      employeeId = requester.id;
    }

    if (!employeeId) {
      throw new BadRequestException('employee_id is required');
    }

    const employee = await this.employeesRepository.findOne({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with id ${employeeId} not found`);
    }

    if (new Date(dto.end_date) < new Date(dto.start_date)) {
      throw new BadRequestException('end_date must not be before start_date');
    }

    const leave = this.leaveRequestsRepository.create({
      ...dto,
      employee_id: employeeId,
      employee,
    });

    const saved = await this.leaveRequestsRepository.save(leave);
    return this.findOne(saved.id, requester);
  }

  /** GET /api/leave-requests?status=&employee_id= — employees see only their own. */
  async findAll(
    requester: User,
    filters: { status?: LeaveStatus; employee_id?: number },
  ): Promise<LeaveRequest[]> {
    const qb = this.leaveRequestsRepository
      .createQueryBuilder('leave')
      .leftJoinAndSelect('leave.employee', 'employee')
      .leftJoinAndSelect('employee.department', 'department')
      .leftJoinAndSelect('leave.reviewed_by', 'reviewer');

    if (filters.status) {
      qb.andWhere('leave.status = :status', { status: filters.status });
    }

    if (filters.employee_id) {
      qb.andWhere('leave.employee_id = :employeeId', {
        employeeId: filters.employee_id,
      });
    }

    // Role-based visibility: employees are restricted to their own requests.
    if (requester.role === UserRole.EMPLOYEE) {
      qb.andWhere('leave.employee_id = :selfId', { selfId: requester.id });
    }

    return qb.orderBy('leave.created_at', 'DESC').getMany();
  }

  async findOne(id: number, requester?: User): Promise<LeaveRequest> {
    const leave = await this.leaveRequestsRepository.findOne({
      where: { id },
      relations: ['employee', 'employee.department', 'reviewed_by'],
    });

    if (!leave) {
      throw new NotFoundException(`Leave request with id ${id} not found`);
    }

    if (
      requester &&
      requester.role === UserRole.EMPLOYEE &&
      leave.employee_id !== requester.id
    ) {
      throw new ForbiddenException(
        'Employees can only view their own leave requests',
      );
    }

    return leave;
  }

  /** GET /api/leave-requests/my — requests filed by the current user. */
  async findMine(userId: number): Promise<LeaveRequest[]> {
    return this.leaveRequestsRepository.find({
      where: { employee_id: userId },
      relations: ['employee', 'employee.department'],
      order: { created_at: 'DESC' },
    });
  }

  /** GET /api/leave-requests/pending — HR review queue. */
  async findPending(): Promise<LeaveRequest[]> {
    return this.leaveRequestsRepository.find({
      where: { status: LeaveStatus.PENDING },
      relations: ['employee', 'employee.department'],
      order: { created_at: 'ASC' },
    });
  }

  /** Employees may edit their own request while it is still pending. */
  async update(
    id: number,
    dto: UpdateLeaveRequestDto,
    requester: User,
  ): Promise<LeaveRequest> {
    const leave = await this.findOne(id, requester);

    if (requester.role === UserRole.EMPLOYEE) {
      if (leave.employee_id !== requester.id) {
        throw new ForbiddenException('You can only edit your own leave requests');
      }
      if (leave.status !== LeaveStatus.PENDING) {
        throw new ForbiddenException(
          'Only pending leave requests can be edited',
        );
      }
    }

    Object.assign(leave, dto);
    await this.leaveRequestsRepository.save(leave);
    return this.findOne(id);
  }

  /** PATCH /api/leave-requests/:id/review — approve or reject (HR/Admin only). */
  async review(
    id: number,
    decision: LeaveStatus,
    reviewer: User,
  ): Promise<LeaveRequest> {
    const leave = await this.leaveRequestsRepository.findOne({
      where: { id },
    });

    if (!leave) {
      throw new NotFoundException(`Leave request with id ${id} not found`);
    }

    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException(
        `This request was already ${leave.status} — it cannot be reviewed again`,
      );
    }

    leave.status = decision;
    leave.reviewed_by_id = reviewer.id;
    leave.reviewed_at = new Date();

    await this.leaveRequestsRepository.save(leave);
    return this.findOne(id);
  }

  async remove(id: number, requester: User): Promise<{ deleted: boolean }> {
    const leave = await this.findOne(id, requester);

    if (
      requester.role !== UserRole.ADMIN &&
      (leave.employee_id !== requester.id || leave.status !== LeaveStatus.PENDING)
    ) {
      throw new ForbiddenException(
        'You can only delete your own pending leave requests',
      );
    }

    await this.leaveRequestsRepository.remove(leave);
    return { deleted: true };
  }
}
