import { LoginDto } from './login.dto';

export class RegisterDto extends LoginDto {
  full_name?: string;
}
