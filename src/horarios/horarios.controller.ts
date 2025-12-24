import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { HorariosService } from './horarios.service';
import { CreateHorarioDto } from './dto/create-horario.dto';
import { UpdateHorarioDto } from './dto/update-horario.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolUsuario } from '@prisma/client';

@Controller('horarios')
export class HorariosController {
  constructor(private readonly horariosService: HorariosService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createHorarioDto: CreateHorarioDto, @Request() req) {
    if (req.user.rol !== RolUsuario.ADMIN) {
      throw new ForbiddenException('Solo administradores pueden crear horarios');
    }
    return this.horariosService.create(createHorarioDto);
  }

  @Get()
  findAll() {
    return this.horariosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.horariosService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateHorarioDto: UpdateHorarioDto, @Request() req) {
    if (req.user.rol !== RolUsuario.ADMIN) {
      throw new ForbiddenException('Solo administradores pueden actualizar horarios');
    }
    return this.horariosService.update(id, updateHorarioDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Request() req) {
    if (req.user.rol !== RolUsuario.ADMIN) {
      throw new ForbiddenException('Solo administradores pueden eliminar horarios');
    }
    return this.horariosService.remove(id);
  }

  @Post('initialize')
  @UseGuards(JwtAuthGuard)
  initialize(@Request() req) {
    if (req.user.rol !== RolUsuario.ADMIN) {
      throw new ForbiddenException('Solo administradores pueden inicializar horarios');
    }
    return this.horariosService.initializeDefaultSchedule();
  }
}
