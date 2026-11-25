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
import { LeaveRequestsService } from './leave-requests.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { ReviewLeaveRequestDto } from './dto/review-leave-request.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { LeaveStatus } from './entities/leave-request.entity';

@Controller('leave-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaveRequestsController {
  constructor(private readonly leaveRequestsService: LeaveRequestsService) {}

  /** GET /api/leave-requests?status=pending&employee_id=1 — filtered list */
  @Get()
  findAll(
    @CurrentUser() user: User,
    @Query('status') status?: LeaveStatus,
    @Query('employee_id') employee_id?: string,
  ) {
    return this.leaveRequestsService.findAll(user, {
      status,
      employee_id: employee_id ? Number(employee_id) : undefined,
    });
  }

  /** GET /api/leave-requests/pending — HR review queue (ADMIN + HR only) */
  @Get('pending')
  @Roles(UserRole.ADMIN, UserRole.HR_OFFICER)
  findPending() {
    return this.leaveRequestsService.findPending();
  }

  /** GET /api/leave-requests/my — the current user's requests */
  @Get('my')
  findMine(@CurrentUser('id') userId: number) {
    return this.leaveRequestsService.findMine(userId);
  }

  /** GET /api/leave-requests/:id — single request (employees: own only) */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.leaveRequestsService.findOne(id, user);
  }

  /** POST /api/leave-requests — file a leave request */
  @Post()
  create(
    @Body() dto: CreateLeaveRequestDto,
    @CurrentUser() user: User,
  ) {
    return this.leaveRequestsService.create(dto, user);
  }

  /** PATCH /api/leave-requests/:id — edit own request while pending */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLeaveRequestDto,
    @CurrentUser() user: User,
  ) {
    return this.leaveRequestsService.update(id, dto, user);
  }

  /** PATCH /api/leave-requests/:id/review — approve/reject (ADMIN + HR only) */
  @Patch(':id/review')
  @Roles(UserRole.ADMIN, UserRole.HR_OFFICER)
  review(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewLeaveRequestDto,
    @CurrentUser() user: User,
  ) {
    return this.leaveRequestsService.review(id, dto.status as LeaveStatus, user);
  }

  /** DELETE /api/leave-requests/:id — own pending requests, or ADMIN */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.leaveRequestsService.remove(id, user);
  }
}
