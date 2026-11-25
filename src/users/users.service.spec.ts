import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersService } from './users.service';
import { User, UserRole } from './entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  const repo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn((dto) => dto),
    save: jest.fn(async (u) => ({ ...u })), // clone so later mutation doesn't hide fields
    remove: jest.fn(async (u) => u),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repo },
      ],
    }).compile();
    service = moduleRef.get(UsersService);
  });

  it('hashes the password on create', async () => {
    repo.findOne.mockResolvedValue(null);
    await service.create({
      full_name: 'Juan',
      email: 'juan@test.com',
      password: 'Password123',
    });
    const saved = repo.save.mock.calls[0][0]; // entity as written to the DB
    expect(saved.password).not.toBe('Password123');
    expect(await bcrypt.compare('Password123', saved.password)).toBe(true);
    expect(saved.full_name).toBe('Juan');
    // role is not set on the entity — the MySQL column default (resident) applies on insert
    expect(saved.role).toBeUndefined();
  });

  it('rejects duplicate email with 409', async () => {
    repo.findOne.mockResolvedValue({ id: 1, email: 'juan@test.com' });
    await expect(
      service.create({
        full_name: 'Juan',
        email: 'juan@test.com',
        password: 'Password123',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('findOne throws 404 for unknown id', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
  });

  it('update hashes a new password', async () => {
    repo.findOne.mockResolvedValue({
      id: 1,
      email: 'juan@test.com',
      password: 'oldhash',
    });
    await service.update(1, { password: 'NewPassword123' });
    const saved = repo.save.mock.calls[0][0];
    expect(saved.password).not.toBe('NewPassword123');
    expect(await bcrypt.compare('NewPassword123', saved.password)).toBe(true);
  });

  it('remove throws 404 for unknown id', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.remove(99)).rejects.toThrow(NotFoundException);
  });
});
