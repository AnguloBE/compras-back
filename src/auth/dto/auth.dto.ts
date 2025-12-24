import { IsString, IsNotEmpty, Matches, IsOptional } from 'class-validator';

export class SolicitarCodigoDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10}$/, {
    message: 'El teléfono debe tener 10 dígitos',
  })
  telefono: string;
}

export class VerificarCodigoDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10}$/, {
    message: 'El teléfono debe tener 10 dígitos',
  })
  telefono: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6}$/, {
    message: 'El código debe tener 6 dígitos',
  })
  codigo: string;
}
