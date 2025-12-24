import { IsString, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';

export class CreateUbicacionDto {
  @IsString()
  nombre: string;

  @IsNumber()
  @Min(0)
  costo: number;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
