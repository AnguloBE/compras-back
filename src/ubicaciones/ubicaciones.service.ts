import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUbicacionDto } from './dto/create-ubicacion.dto';
import { UpdateUbicacionDto } from './dto/update-ubicacion.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UbicacionesService {
  constructor(private prisma: PrismaService) {}

  async create(createUbicacionDto: CreateUbicacionDto) {
    return this.prisma.ubicacion.create({
      data: createUbicacionDto,
    });
  }

  async findAll() {
    return this.prisma.ubicacion.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: string) {
    const ubicacion = await this.prisma.ubicacion.findUnique({
      where: { id },
    });
    if (!ubicacion) {
      throw new NotFoundException(`Ubicación con ID ${id} no encontrada`);
    }
    return ubicacion;
  }

  async update(id: string, updateUbicacionDto: UpdateUbicacionDto) {
    await this.findOne(id);
    return this.prisma.ubicacion.update({
      where: { id },
      data: updateUbicacionDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.ubicacion.delete({
      where: { id },
    });
  }
}
