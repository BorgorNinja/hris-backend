import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { Incident, IncidentStatus } from './entities/incident.entity';
import { User, UserRole } from '../users/entities/user.entity';

describe('IncidentsService', () => {
  let service: IncidentsService;
  const repo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn((dto) => dto),
    save: jest.fn(async (i) => i),
    remove: jest.fn(async (i) => i),
    count: jest.fn(async () => 2),
    createQueryBuilder: jest.fn(),
  };

  const admin = { id: 1, role: UserRole.ADMIN } as User;
  const resident = { id: 3, role: UserRole.RESIDENT } as User;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        IncidentsService,
        { provide: getRepositoryToken(Incident), useValue: repo },
      ],
    }).compile();
    service = moduleRef.get(IncidentsService);
  });

  it('attaches the authenticated reporter on create', async () => {
    repo.findOne.mockResolvedValue({
      id: 5,
      title: 't',
      reported_by_id: 3,
      zone_id: 1,
    });
    await service.create(
      { title: 'Test report', description: 'd', category: 'c', location: 'l', zone_id: 1 },
      resident,
    );
    const created = repo.save.mock.calls[0][0];
    expect(created.reported_by).toBe(resident);
  });

  it('a resident cannot change incident status (403)', async () => {
    repo.findOne.mockResolvedValue({
      id: 5,
      title: 't',
      status: 'reported',
      reported_by_id: 3,
    });
    await expect(
      service.update(5, { status: IncidentStatus.VERIFIED }, resident),
    ).rejects.toThrow(ForbiddenException);
  });

  it('a resident cannot delete someone else’s incident (403)', async () => {
    repo.findOne.mockResolvedValue({
      id: 5,
      title: 't',
      reported_by_id: 99, // filed by another user
    });
    await expect(service.remove(5, resident)).rejects.toThrow(ForbiddenException);
  });

  it('an admin can delete any incident', async () => {
    repo.findOne.mockResolvedValue({ id: 5, title: 't', reported_by_id: 99 });
    await expect(service.remove(5, admin)).resolves.toEqual({ deleted: true });
  });
});
