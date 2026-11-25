import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { LeaveType } from '../entities/leave-request.entity';

export class UpdateLeaveRequestDto {
  @IsOptional()
  @IsEnum(LeaveType)
  leave_type?: LeaveType;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  reason?: string;
}
