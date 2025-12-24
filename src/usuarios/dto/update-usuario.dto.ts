import { IsString, IsOptional, IsDateString } from 'class-validator';

export class UpdateUsuarioDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsDateString()
  @IsOptional()
  fechaNacimiento?: string;
}
