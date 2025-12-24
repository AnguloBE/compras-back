import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateHorarioDto } from './dto/create-horario.dto';
import { UpdateHorarioDto } from './dto/update-horario.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HorariosService {
  constructor(private prisma: PrismaService) {}

  async create(createHorarioDto: CreateHorarioDto) {
    // Desactivar horarios existentes para este día
    await this.prisma.horarioAtencion.updateMany({
      where: { dia: createHorarioDto.dia, activo: true },
      data: { activo: false },
    });

    // Crear nuevo horario activo
    return this.prisma.horarioAtencion.create({
      data: createHorarioDto,
    });
  }

  async findAll() {
    return this.prisma.horarioAtencion.findMany({
      where: { activo: true },
      orderBy: {
        dia: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const horario = await this.prisma.horarioAtencion.findUnique({
      where: { id },
    });

    if (!horario) {
      throw new NotFoundException(`Horario con ID ${id} no encontrado`);
    }

    return horario;
  }

  async update(id: string, updateHorarioDto: UpdateHorarioDto) {
    await this.findOne(id); // Verificar que existe

    return this.prisma.horarioAtencion.update({
      where: { id },
      data: updateHorarioDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Verificar que existe

    return this.prisma.horarioAtencion.delete({
      where: { id },
    });
  }

  async initializeDefaultSchedule() {
    const count = await this.prisma.horarioAtencion.count({
      where: { activo: true },
    });

    // Solo inicializar si no hay horarios
    if (count === 0) {
      const diasSemana = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];
      
      for (const dia of diasSemana) {
        await this.prisma.horarioAtencion.create({
          data: {
            dia: dia as any,
            horaApertura: '09:00',
            horaCierre: '18:00',
            cerrado: dia === 'DOMINGO', // Cerrado los domingos por defecto
          },
        });
      }
    }
  }
}
