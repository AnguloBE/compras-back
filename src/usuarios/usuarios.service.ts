import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RolUsuario } from '@prisma/client';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  async create(createUsuarioDto: CreateUsuarioDto) {
    return this.prisma.usuario.create({
      data: createUsuarioDto,
      select: {
        id: true,
        nombre: true,
        telefono: true,
        rol: true,
        fechaNacimiento: true,
        createdAt: true,
      },
    });
  }

  async findAll(rol?: RolUsuario) {
    return this.prisma.usuario.findMany({
      where: rol ? { rol } : {},
      select: {
        id: true,
        nombre: true,
        telefono: true,
        rol: true,
        fechaNacimiento: true,
        createdAt: true,
        _count: {
          select: {
            pedidos: true,
            pedidosEntregados: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        telefono: true,
        rol: true,
        fechaNacimiento: true,
        createdAt: true,
        pedidos: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        pedidosEntregados: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return usuario;
  }

  async update(id: string, updateUsuarioDto: UpdateUsuarioDto) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return this.prisma.usuario.update({
      where: { id },
      data: updateUsuarioDto,
      select: {
        id: true,
        nombre: true,
        telefono: true,
        rol: true,
        fechaNacimiento: true,
        createdAt: true,
      },
    });
  }

  async updateRol(id: string, rol: RolUsuario) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return this.prisma.usuario.update({
      where: { id },
      data: { rol },
      select: {
        id: true,
        nombre: true,
        telefono: true,
        rol: true,
        fechaNacimiento: true,
        createdAt: true,
      },
    });
  }
}
