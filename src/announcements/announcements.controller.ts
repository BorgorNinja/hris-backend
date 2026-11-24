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
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';

@Controller('announcements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  /** GET /api/announcements — full list; ?published_only=true hides drafts */
  @Get()
  findAll(@Query('published_only') publishedOnly?: string) {
    return this.announcementsService.findAll(publishedOnly === 'true');
  }

  /** GET /api/announcements/:id */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.announcementsService.findOne(id);
  }

  /** POST /api/announcements — ADMIN + OFFICIAL only */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.OFFICIAL)
  create(
    @Body() createAnnouncementDto: CreateAnnouncementDto,
    @CurrentUser() user: User,
  ) {
    return this.announcementsService.create(createAnnouncementDto, user);
  }

  /** PATCH /api/announcements/:id — ADMIN + OFFICIAL only */
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.OFFICIAL)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAnnouncementDto: UpdateAnnouncementDto,
  ) {
    return this.announcementsService.update(id, updateAnnouncementDto);
  }

  /** DELETE /api/announcements/:id — ADMIN + OFFICIAL only */
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.OFFICIAL)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.announcementsService.remove(id);
  }
}
