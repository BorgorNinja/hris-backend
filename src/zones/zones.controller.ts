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
import { ZonesService } from './zones.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('zones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  /** GET /api/zones — any authenticated user */
  @Get()
  findAll() {
    return this.zonesService.findAll();
  }

  /** GET /api/zones/:id — any authenticated user */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.zonesService.findOne(id);
  }

  /** POST /api/zones — ADMIN + OFFICIAL only */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.OFFICIAL)
  create(@Body() createZoneDto: CreateZoneDto) {
    return this.zonesService.create(createZoneDto);
  }

  /** PATCH /api/zones/:id — ADMIN + OFFICIAL only */
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.OFFICIAL)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateZoneDto: UpdateZoneDto,
  ) {
    return this.zonesService.update(id, updateZoneDto);
  }

  /** DELETE /api/zones/:id — ADMIN only */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.zonesService.remove(id);
  }
}
