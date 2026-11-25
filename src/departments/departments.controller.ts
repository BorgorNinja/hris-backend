import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  /** GET /api/departments — any authenticated user */
  @Get()
  findAll() {
    return this.departmentsService.findAll();
  }

  /** GET /api/departments/:id — any authenticated user */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.departmentsService.findOne(id);
  }

  /** POST /api/departments — ADMIN + HR only */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR_OFFICER)
  create(@Body() dto: CreateDepartmentDto) {
    return this.departmentsService.create(dto);
  }

  /** PATCH /api/departments/:id — ADMIN + HR only */
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.HR_OFFICER)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDepartmentDto) {
    return this.departmentsService.update(id, dto);
  }

  /** DELETE /api/departments/:id — ADMIN only */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.departmentsService.remove(id);
  }
}
