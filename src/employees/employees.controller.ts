import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { EmployeeStatus } from './entities/employee.entity';

@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  /** GET /api/employees?department_id=1&status=active — filterable directory */
  @Get()
  findAll(
    @Query('department_id') department_id?: string,
    @Query('status') status?: EmployeeStatus,
  ) {
    return this.employeesService.findAll({
      department_id: department_id ? Number(department_id) : undefined,
      status,
    });
  }

  /** GET /api/employees/stats — HR dashboard summary (ADMIN + HR) */
  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.HR_OFFICER)
  stats() {
    return this.employeesService.stats();
  }

  /** GET /api/employees/:id — single employee record */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.employeesService.findOne(id);
  }

  /** POST /api/employees — create employee record (ADMIN + HR only) */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR_OFFICER)
  create(@Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(dto);
  }

  /** PATCH /api/employees/:id — update record (ADMIN + HR only) */
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.HR_OFFICER)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEmployeeDto) {
    return this.employeesService.update(id, dto);
  }

  /** DELETE /api/employees/:id — remove record (ADMIN only) */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.employeesService.remove(id);
  }
}
