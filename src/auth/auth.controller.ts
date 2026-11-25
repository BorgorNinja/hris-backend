import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { User } from '../users/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** POST /api/auth/register — public: creates a EMPLOYEE account and returns a JWT */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() registerDto: LoginDto & { full_name?: string }) {
    return this.authService.register(registerDto);
  }

  /** POST /api/auth/login — public: returns a signed JWT token */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /** GET /api/auth/profile — protected: requires a valid Bearer token */
  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  profile(@CurrentUser() user: User) {
    return {
      message: 'Token is valid — protected route accessed successfully',
      user,
    };
  }

  /** PATCH /api/auth/password — protected: change own password */
  @Patch('password')
  @UseGuards(AuthGuard('jwt'))
  changePassword(
    @CurrentUser('id') userId: number,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, dto);
  }
}
