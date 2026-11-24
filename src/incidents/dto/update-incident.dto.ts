import { IsEnum, IsOptional, IsString } from 'class-validator';
import { IncidentSeverity, IncidentStatus } from '../entities/incident.entity';

export class UpdateIncidentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(IncidentSeverity)
  severity?: IncidentSeverity;

  /** Only ADMIN/OFFICIAL may set the status (enforced in the controller). */
  @IsOptional()
  @IsEnum(IncidentStatus)
  status?: IncidentStatus;

  @IsOptional()
  zone_id?: number;
}
