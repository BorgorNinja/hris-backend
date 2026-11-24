import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from './entities/announcement.entity';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(Announcement)
    private readonly announcementsRepository: Repository<Announcement>,
  ) {}

  async create(dto: CreateAnnouncementDto, author: User): Promise<Announcement> {
    const announcement = this.announcementsRepository.create({
      ...dto,
      posted_by_id: author.id,
    });

    const saved = await this.announcementsRepository.save(announcement);
    return this.findOne(saved.id);
  }

  async findAll(publishedOnly?: boolean): Promise<Announcement[]> {
    if (publishedOnly) {
      return this.announcementsRepository.find({
        where: { is_published: true },
        order: { created_at: 'DESC' },
      });
    }

    return this.announcementsRepository.find({
      relations: ['posted_by'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Announcement> {
    const announcement = await this.announcementsRepository.findOne({
      where: { id },
      relations: ['posted_by'],
    });

    if (!announcement) {
      throw new NotFoundException(`Announcement with id ${id} not found`);
    }

    return announcement;
  }

  async update(
    id: number,
    dto: UpdateAnnouncementDto,
  ): Promise<Announcement> {
    const announcement = await this.findOne(id);

    Object.assign(announcement, dto);
    await this.announcementsRepository.save(announcement);
    return this.findOne(id);
  }

  async remove(id: number): Promise<{ deleted: boolean }> {
    const announcement = await this.findOne(id);

    await this.announcementsRepository.remove(announcement);
    return { deleted: true };
  }
}
