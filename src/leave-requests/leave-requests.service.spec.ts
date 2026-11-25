import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { LeaveRequestsService } from './leave-requests.service';
import { LeaveRequest, LeaveStatus } from './entities/leave-request.entity';
import { Employee } from '../employees/entities/employee.entity';
import { User, UserRole } from '../users/entities/user.entity';

describe('LeaveRequestsService', () => {
  let service: LeaveRequestsService;
  const leaveRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn((dto) => dto),
    save: jest.fn(async (l) => ({ ...l, id: l.id ?? 1 })),
    remove: jest.fn(async (l) => l),
    createQueryBuilder: jest.fn(),
  };
  const employeeRepo = { findOne: jest.fn() };

  const hr = { id: 2, role: UserRole.HR_OFFICER } as User;
  const employee = { id: 3, role: UserRole.EMPLOYEE } as User;
  const pending = {
    id: 1,
    employee_id: 3,
    status: LeaveStatus.PENDING,
    start_date: '2026-11-27',
    end_date: '2026-11-28',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        LeaveRequestsService,
        { provide: getRepositoryToken(LeaveRequest), useValue: leaveRepo },
        { provide: getRepositoryToken(Employee), useValue: employeeRepo },
      ],
    }).compile();
    service = moduleRef.get(LeaveRequestsService);
  });

  it('HR can review a pending request — reviewer and timestamp recorded', async () => {
    leaveRepo.findOne.mockResolvedValue({ ...pending });
    const result = await service.review(1, LeaveStatus.APPROVED, hr);
    expect(result.status).toBe(LeaveStatus.APPROVED);
    expect(result.reviewed_by_id).toBe(2);
    expect(result.reviewed_at).toBeInstanceOf(Date);
  });

  it('an already-reviewed request cannot be reviewed again (400)', async () => {
    leaveRepo.findOne.mockResolvedValue({ ...pending, status: LeaveStatus.APPROVED });
    await expect(
      service.review(1, LeaveStatus.REJECTED, hr),
    ).rejects.toThrow(BadRequestException);
  });

  it('an employee cannot edit someone else’s leave request (403)', async () => {
    leaveRepo.findOne.mockResolvedValue({ ...pending, employee_id: 99 });
    await expect(
      service.update(1, { reason: 'changed reason here' }, employee),
    ).rejects.toThrow(ForbiddenException);
  });

  it('an employee cannot delete an already-approved request (403)', async () => {
    leaveRepo.findOne.mockResolvedValue({ ...pending, status: LeaveStatus.APPROVED });
    await expect(service.remove(1, employee)).rejects.toThrow(ForbiddenException);
  });

  it('filing requires an existing employee (404)', async () => {
    employeeRepo.findOne.mockResolvedValue(null);
    await expect(
      service.create(
        {
          employee_id: 42,
          leave_type: 'sick' as never,
          start_date: '2026-12-01',
          end_date: '2026-12-02',
          reason: 'clinic visit',
        },
        hr,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('end_date before start_date is rejected (400)', async () => {
    employeeRepo.findOne.mockResolvedValue({ id: 3 });
    await expect(
      service.create(
        {
          employee_id: 3,
          leave_type: 'vacation' as never,
          start_date: '2026-12-05',
          end_date: '2026-12-01',
          reason: 'family trip',
        },
        hr,
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
