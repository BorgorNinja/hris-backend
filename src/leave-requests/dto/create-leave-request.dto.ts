import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { LeaveType } from '../entities/leave-request.entity';

export class CreateLeaveRequestDto {
  /** HR/Admin may file on behalf of anyone; employees always file for themselves. */
  @IsOptional()
  @IsNumber()
  employee_id?: number;

  @IsEnum(LeaveType)
  leave_type: LeaveType;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;

  @IsString()
  @MinLength(5)
  reason: string;
}
