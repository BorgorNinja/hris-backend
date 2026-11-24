import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incident, IncidentStatus } from './entities/incident.entity';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(Incident)
    private readonly incidentsRepository: Repository<Incident>,
  ) {}

  async create(dto: CreateIncidentDto, reporter: User): Promise<Incident> {
    const incident = this.incidentsRepository.create({
      ...dto,
      reported_by_id: reporter.id,
    });

    const saved = await this.incidentsRepository.save(incident);
    return this.findOne(saved.id);
  }

  /**
   * GET /api/incidents?status=&severity=&zone_id=
   * Residents only see their own reports; admins/officials see everything.
   */
  async findAll(
    requester: User,
    filters: { status?: IncidentStatus; severity?: string; zone_id?: number },
  ): Promise<Incident[]> {
    const qb = this.incidentsRepository
      .createQueryBuilder('incident')
      .leftJoinAndSelect('incident.zone', 'zone')
      .leftJoinAndSelect('incident.reported_by', 'reporter');

    if (filters.status) {
      qb.andWhere('incident.status = :status', { status: filters.status });
    }

    if (filters.severity) {
      qb.andWhere('incident.severity = :severity', {
        severity: filters.severity,
      });
    }

    if (filters.zone_id) {
      qb.andWhere('incident.zone_id = :zoneId', { zoneId: filters.zone_id });
    }

    // Role-based visibility: residents are restricted to their own reports.
    if (requester.role === UserRole.RESIDENT) {
      qb.andWhere('incident.reported_by_id = :userId', {
        userId: requester.id,
      });
    }

    return qb.orderBy('incident.created_at', 'DESC').getMany();
  }

  async findOne(id: number, requester?: User): Promise<Incident> {
    const incident = await this.incidentsRepository.findOne({
      where: { id },
      relations: ['zone', 'reported_by'],
    });

    if (!incident) {
      throw new NotFoundException(`Incident with id ${id} not found`);
    }

    if (
      requester &&
      requester.role === UserRole.RESIDENT &&
      incident.reported_by_id !== requester.id
    ) {
      throw new ForbiddenException(
        'Residents can only view their own incident reports',
      );
    }

    return incident;
  }

  async update(
    id: number,
    dto: UpdateIncidentDto,
    requester: User,
  ): Promise<Incident> {
    const incident = await this.findOne(id, requester);

    // Only admins/officials may change the status or verify/reject reports.
    if (
      dto.status &&
      dto.status !== incident.status &&
      requester.role === UserRole.RESIDENT
    ) {
      throw new ForbiddenException(
        'Only administrators and officials can change incident status',
      );
    }

    Object.assign(incident, dto);
    await this.incidentsRepository.save(incident);
    return this.findOne(id);
  }

  async remove(id: number, requester: User): Promise<{ deleted: boolean }> {
    const incident = await this.findOne(id, requester);

    // Residents may delete their own reports; admins may delete any.
    if (
      requester.role !== UserRole.ADMIN &&
      incident.reported_by_id !== requester.id
    ) {
      throw new ForbiddenException(
        'You can only delete incident reports you filed',
      );
    }

    await this.incidentsRepository.remove(incident);
    return { deleted: true };
  }

  /** GET /api/incidents/my — reports filed by the authenticated user. */
  async findMine(userId: number): Promise<Incident[]> {
    return this.incidentsRepository.find({
      where: { reported_by_id: userId },
      relations: ['zone'],
      order: { created_at: 'DESC' },
    });
  }

  /** GET /api/incidents/stats — dashboard summary counts. */
  async stats(): Promise<{
    total: number;
    by_status: Record<IncidentStatus, number>;
    by_severity: Record<string, number>;
  }> {
    const [byStatus, bySeverity, total] = await Promise.all([
      this.incidentsRepository
        .createQueryBuilder('incident')
        .select('incident.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('incident.status')
        .getRawMany(),
      this.incidentsRepository
        .createQueryBuilder('incident')
        .select('incident.severity', 'severity')
        .addSelect('COUNT(*)', 'count')
        .groupBy('incident.severity')
        .getRawMany(),
      this.incidentsRepository.count(),
    ]);

    const by_status = Object.fromEntries(
      byStatus.map((row) => [row.status, Number(row.count)]),
    ) as Record<IncidentStatus, number>;

    const by_severity = Object.fromEntries(
      bySeverity.map((row) => [row.severity, Number(row.count)]),
    );

    return { total, by_status, by_severity };
  }
}
