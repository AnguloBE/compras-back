import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { PedidosService } from './pedidos.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EstadoPedido } from '@prisma/client';

@Controller('pedidos')
@UseGuards(JwtAuthGuard)
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Post()
  create(@Body() createPedidoDto: CreatePedidoDto, @Request() req) {
    return this.pedidosService.create(createPedidoDto, req.user.sub);
  }

  @Get()
  findAll(@Query('estado') estado?: EstadoPedido, @Request() req?) {
    // Si el usuario es USUARIO, solo ve sus pedidos
    // Si es ADMIN o REPARTIDOR, ve todos
    const esUsuarioNormal = req?.user?.rol === 'USUARIO';
    const usuarioId = esUsuarioNormal ? req.user.sub : undefined;
    
    return this.pedidosService.findAll(usuarioId, estado);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pedidosService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePedidoDto: UpdatePedidoDto) {
    return this.pedidosService.update(id, updatePedidoDto);
  }

  @Patch(':id/asignar-repartidor')
  asignarRepartidor(@Param('id') id: string, @Body('repartidorId') repartidorId: string) {
    return this.pedidosService.asignarRepartidor(id, repartidorId);
  }

  @Patch(':id/estado')
  cambiarEstado(@Param('id') id: string, @Body('estado') estado: EstadoPedido) {
    return this.pedidosService.cambiarEstado(id, estado);
  }

  @Patch(':id/tomar')
  tomarPedido(@Param('id') id: string, @Request() req) {
    return this.pedidosService.tomarPedido(id, req.user.sub);
  }

  @Patch(':id/en-camino')
  marcarEnCamino(@Param('id') id: string) {
    return this.pedidosService.marcarEnCamino(id);
  }
}
