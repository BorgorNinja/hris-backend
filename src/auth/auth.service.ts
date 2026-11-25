import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

export interface JwtPayload {
  sub: number;
  email: string;
  role: UserRole;
}

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  private readonly jwtService = new JwtService({
    secret: process.env.JWT_SECRET || 'hris-final-project-jwt-secret-2026',
    signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '1d' },
  });

  /** Registers a new employee account and returns an access token. */
  async register(registerDto: LoginDto & { full_name?: string }) {
    const existing = await this.usersService.findByEmailWithPassword(
      registerDto.email,
    );

    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const user = await this.usersService.create({
      full_name: registerDto.full_name ?? registerDto.email.split('@')[0],
      email: registerDto.email,
      password: registerDto.password,
      role: UserRole.EMPLOYEE,
    });

    return this.issueToken(user);
  }

  /** Validates credentials and returns a signed JWT on success. */
  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(
      loginDto.email,
    );

    // Same generic message for unknown email / wrong password (no user enumeration).
    if (!user || !user.is_active) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueToken(user);
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.usersService.findByIdWithPassword(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordMatches = await bcrypt.compare(
      dto.current_password,
      user.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    await this.usersService.update(userId, { password: dto.new_password });

    return { message: 'Password updated successfully' };
  }

  private issueToken(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      token_type: 'Bearer',
      expires_in: process.env.JWT_EXPIRES_IN || '1d',
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    };
  }
}
