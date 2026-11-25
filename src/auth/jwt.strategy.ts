import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './auth.service';
import { User, UserRole } from '../users/entities/user.entity';

/**
 * Validates the JWT found in the Authorization: Bearer <token> header.
 * The decoded payload is used to load the user; the result is attached
 * to request.user and later checked by the RolesGuard.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'hris-final-project-jwt-secret-2026',
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.usersService.findOne(payload.sub);

    if (!user || !user.is_active) {
      throw new UnauthorizedException('Token belongs to an inactive user');
    }

    return { ...user, role: payload.role as UserRole } as User;
  }
}
