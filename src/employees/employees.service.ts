import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee, EmployeeStatus } from './entities/employee.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeesRepository: Repository<Employee>,
  ) {}

  async create(dto: CreateEmployeeDto): Promise<Employee> {
    const existing = await this.employeesRepository.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException(
        `An employee with email ${dto.email} already exists`,
      );
    }

    const employee = this.employeesRepository.create(dto);
    const saved = await this.employeesRepository.save(employee);
    return this.findOne(saved.id);
  }

  /** GET /api/employees?department_id=&status= — filterable directory */
  async findAll(filters: {
    department_id?: number;
    status?: EmployeeStatus;
  }): Promise<Employee[]> {
    const qb = this.employeesRepository
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.department', 'department');

    if (filters.department_id) {
      qb.andWhere('employee.department_id = :deptId', {
        deptId: filters.department_id,
      });
    }

    if (filters.status) {
      qb.andWhere('employee.status = :status', { status: filters.status });
    }

    return qb.orderBy('employee.full_name', 'ASC').getMany();
  }

  async findOne(id: number): Promise<Employee> {
    const employee = await this.employeesRepository.findOne({
      where: { id },
      relations: ['department'],
    });

    if (!employee) {
      throw new NotFoundException(`Employee with id ${id} not found`);
    }

    return employee;
  }

  async update(id: number, dto: UpdateEmployeeDto): Promise<Employee> {
    const employee = await this.employeesRepository.findOne({ where: { id } });

    if (!employee) {
      throw new NotFoundException(`Employee with id ${id} not found`);
    }

    Object.assign(employee, dto);
    await this.employeesRepository.save(employee);
    return this.findOne(id);
  }

  async remove(id: number): Promise<{ deleted: boolean }> {
    const employee = await this.employeesRepository.findOne({ where: { id } });

    if (!employee) {
      throw new NotFoundException(`Employee with id ${id} not found`);
    }

    await this.employeesRepository.remove(employee);
    return { deleted: true };
  }

  /** GET /api/employees/stats — HR dashboard summary. */
  async stats(): Promise<{
    total: number;
    by_status: Record<string, number>;
    by_department: { department: string; count: number }[];
  }> {
    const byStatus = await this.employeesRepository
      .createQueryBuilder('employee')
      .select('employee.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('employee.status')
      .getRawMany();

    const byDepartment = await this.employeesRepository
      .createQueryBuilder('employee')
      .leftJoin('employee.department', 'department')
      .select('department.name', 'department')
      .addSelect('COUNT(*)', 'count')
      .groupBy('department.name')
      .getRawMany();

    return {
      total: await this.employeesRepository.count(),
      by_status: Object.fromEntries(
        byStatus.map((r) => [r.status, Number(r.count)]),
      ),
      by_department: byDepartment.map((r) => ({
        department: r.department,
        count: Number(r.count),
      })),
    };
  }
}
