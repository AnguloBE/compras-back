import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, Min, IsEnum } from 'class-validator';
import { Type, Transform } from 'class-transformer';

enum UnidadMedida {
  L = 'L',
  ML = 'ML',
  KG = 'KG',
  GR = 'GR',
  PZ = 'PZ',
  MTR = 'MTR',
}

export class CreateProductoDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  codigoBarras?: string;

  @IsString()
  @IsOptional()
  marca?: string;

  @IsString()
  @IsOptional()
  contenido?: string;

  @IsEnum(UnidadMedida)
  @IsOptional()
  medida?: UnidadMedida;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  precioCompra: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  precioVenta: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  stock: number;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  permiteEncargo?: boolean;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  activo?: boolean;

  @IsString()
  @IsNotEmpty()
  categoriaId: string;
}
