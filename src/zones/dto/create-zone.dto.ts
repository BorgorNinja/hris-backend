import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateZoneDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
