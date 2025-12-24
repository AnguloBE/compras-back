import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolUsuario } from '@prisma/client';

@Controller('usuarios')
@UseGuards(JwtAuthGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  create(@Body() createUsuarioDto: CreateUsuarioDto, @Request() req) {
    // Solo ADMIN puede crear usuarios manualmente
    if (req.user.rol !== RolUsuario.ADMIN) {
      throw new ForbiddenException('Solo administradores pueden crear usuarios');
    }
    return this.usuariosService.create(createUsuarioDto);
  }

  @Get()
  findAll(@Query('rol') rol?: RolUsuario, @Request() req?) {
    // Solo ADMIN puede ver todos los usuarios
    if (req.user.rol !== RolUsuario.ADMIN) {
      throw new ForbiddenException('Solo administradores pueden ver todos los usuarios');
    }
    return this.usuariosService.findAll(rol);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    // Los usuarios solo pueden ver su propio perfil, admin ve todos
    if (req.user.rol !== RolUsuario.ADMIN && req.user.sub !== id) {
      throw new ForbiddenException('No tienes permiso para ver este perfil');
    }
    return this.usuariosService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUsuarioDto: UpdateUsuarioDto, @Request() req) {
    // Los usuarios solo pueden actualizar su propio perfil, admin actualiza todos
    if (req.user.rol !== RolUsuario.ADMIN && req.user.sub !== id) {
      throw new ForbiddenException('No tienes permiso para actualizar este perfil');
    }
    return this.usuariosService.update(id, updateUsuarioDto);
  }

  @Patch(':id/rol')
  updateRol(@Param('id') id: string, @Body('rol') rol: RolUsuario, @Request() req) {
    // Solo ADMIN puede cambiar roles
    if (req.user.rol !== RolUsuario.ADMIN) {
      throw new ForbiddenException('Solo administradores pueden cambiar roles');
    }
    return this.usuariosService.updateRol(id, rol);
  }
}
