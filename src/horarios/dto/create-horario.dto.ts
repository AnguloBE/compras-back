import { IsEnum, IsString, IsBoolean, IsOptional, Matches } from 'class-validator';
import { DiaSemana } from '@prisma/client';

export class CreateHorarioDto {
  @IsEnum(DiaSemana)
  dia: DiaSemana;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'horaApertura debe estar en formato HH:mm (ej: 09:00)',
  })
  horaApertura: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'horaCierre debe estar en formato HH:mm (ej: 18:00)',
  })
  horaCierre: string;

  @IsOptional()
  @IsBoolean()
  cerrado?: boolean;
}
