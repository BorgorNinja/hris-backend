import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentsRepository: Repository<Department>,
  ) {}

  async create(dto: CreateDepartmentDto): Promise<Department> {
    const existing = await this.departmentsRepository.findOne({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException(`Department "${dto.name}" already exists`);
    }

    const department = this.departmentsRepository.create(dto);
    return this.departmentsRepository.save(department);
  }

  async findAll(): Promise<Department[]> {
    return this.departmentsRepository.find({ relations: ['employees'] });
  }

  async findOne(id: number): Promise<Department> {
    const department = await this.departmentsRepository.findOne({
      where: { id },
      relations: ['employees'],
    });

    if (!department) {
      throw new NotFoundException(`Department with id ${id} not found`);
    }

    return department;
  }

  async update(id: number, dto: UpdateDepartmentDto): Promise<Department> {
    const department = await this.departmentsRepository.findOne({ where: { id } });

    if (!department) {
      throw new NotFoundException(`Department with id ${id} not found`);
    }

    Object.assign(department, dto);
    return this.departmentsRepository.save(department);
  }

  async remove(id: number): Promise<{ deleted: boolean }> {
    const department = await this.departmentsRepository.findOne({ where: { id } });

    if (!department) {
      throw new NotFoundException(`Department with id ${id} not found`);
    }

    await this.departmentsRepository.remove(department);
    return { deleted: true };
  }
}
