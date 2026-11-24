import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Zone } from './entities/zone.entity';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';

@Injectable()
export class ZonesService {
  constructor(
    @InjectRepository(Zone)
    private readonly zonesRepository: Repository<Zone>,
  ) {}

  async create(createZoneDto: CreateZoneDto): Promise<Zone> {
    const existing = await this.zonesRepository.findOne({
      where: { name: createZoneDto.name },
    });

    if (existing) {
      throw new ConflictException(
        `Zone "${createZoneDto.name}" already exists`,
      );
    }

    const zone = this.zonesRepository.create(createZoneDto);
    return this.zonesRepository.save(zone);
  }

  async findAll(): Promise<Zone[]> {
    return this.zonesRepository.find({ relations: ['incidents'] });
  }

  async findOne(id: number): Promise<Zone> {
    const zone = await this.zonesRepository.findOne({
      where: { id },
      relations: ['incidents'],
    });

    if (!zone) {
      throw new NotFoundException(`Zone with id ${id} not found`);
    }

    return zone;
  }

  async update(id: number, updateZoneDto: UpdateZoneDto): Promise<Zone> {
    const zone = await this.zonesRepository.findOne({ where: { id } });

    if (!zone) {
      throw new NotFoundException(`Zone with id ${id} not found`);
    }

    Object.assign(zone, updateZoneDto);
    return this.zonesRepository.save(zone);
  }

  async remove(id: number): Promise<{ deleted: boolean }> {
    const zone = await this.zonesRepository.findOne({ where: { id } });

    if (!zone) {
      throw new NotFoundException(`Zone with id ${id} not found`);
    }

    await this.zonesRepository.remove(zone);
    return { deleted: true };
  }
}
