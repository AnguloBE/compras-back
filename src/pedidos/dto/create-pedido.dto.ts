import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, ValidateNested, IsDateString, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoPedido } from '@prisma/client';

class ItemPedidoDto {
  @IsString()
  @IsNotEmpty()
  productoId: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0.01)
  cantidad: number;
}

export class CreatePedidoDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemPedidoDto)
  items: ItemPedidoDto[];

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  costoEnvio?: number;

  @IsString()
  @IsOptional()
  ubicacionEnvio?: string;

  @IsDateString()
  @IsOptional()
  fechaEncargo?: string;

  @IsString()
  @IsOptional()
  notas?: string;
}
