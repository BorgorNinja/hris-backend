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
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { IncidentStatus } from './entities/incident.entity';

@Controller('incidents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  /** GET /api/incidents?status=reported&severity=high&zone_id=1 — filtered list */
  @Get()
  findAll(
    @CurrentUser() user: User,
    @Query('status') status?: IncidentStatus,
    @Query('severity') severity?: string,
    @Query('zone_id') zone_id?: string,
  ) {
    return this.incidentsService.findAll(user, {
      status,
      severity,
      zone_id: zone_id ? Number(zone_id) : undefined,
    });
  }

  /** GET /api/incidents/stats — dashboard summary (ADMIN + OFFICIAL) */
  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.OFFICIAL)
  stats() {
    return this.incidentsService.stats();
  }

  /** GET /api/incidents/my — reports filed by the current user */
  @Get('my')
  findMine(@CurrentUser('id') userId: number) {
    return this.incidentsService.findMine(userId);
  }

  /** GET /api/incidents/:id — single report */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.incidentsService.findOne(id, user);
  }

  /** POST /api/incidents — file a new incident report */
  @Post()
  create(
    @Body() createIncidentDto: CreateIncidentDto,
    @CurrentUser() user: User,
  ) {
    return this.incidentsService.create(createIncidentDto, user);
  }

  /** PATCH /api/incidents/:id — update a report (status changes: ADMIN/OFFICIAL) */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateIncidentDto: UpdateIncidentDto,
    @CurrentUser() user: User,
  ) {
    return this.incidentsService.update(id, updateIncidentDto, user);
  }

  /** DELETE /api/incidents/:id — remove a report (own reports, or ADMIN) */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.incidentsService.remove(id, user);
  }
}
