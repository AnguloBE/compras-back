import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { EstadoPedido, Prisma } from '@prisma/client';

@Injectable()
export class PedidosService {
  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsappService,
  ) {}

  async create(createPedidoDto: CreatePedidoDto, usuarioId: string) {
    // Calcular totales
    let subtotal = new Prisma.Decimal(0);
    const detalles: Array<{
      productoId: string;
      cantidad: number;
      precioUnitario: Prisma.Decimal;
      subtotal: Prisma.Decimal;
    }> = [];

    for (const item of createPedidoDto.items) {
      const producto = await this.prisma.producto.findUnique({
        where: { id: item.productoId },
      });

      if (!producto || !producto.activo) {
        throw new BadRequestException(`Producto ${item.productoId} no encontrado o inactivo`);
      }

      // Verificar stock solo si NO permite encargo
      // Si permite encargo, se puede pedir aunque no haya stock
      if (!producto.permiteEncargo && Number(producto.stock) < item.cantidad) {
        throw new BadRequestException(`Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}`);
      }

      const precioUnitario = new Prisma.Decimal(producto.precioVenta.toString());
      const cantidad = new Prisma.Decimal(item.cantidad);
      const subtotalItem = precioUnitario.mul(cantidad);
      subtotal = subtotal.add(subtotalItem);

      detalles.push({
        productoId: item.productoId,
        cantidad: item.cantidad,
        precioUnitario: producto.precioVenta,
        subtotal: subtotalItem,
      });
    }

    const costoEnvio = new Prisma.Decimal(createPedidoDto.costoEnvio || 0);
    const total = subtotal.add(costoEnvio);

    // Convertir fechaEncargo a formato ISO si existe
    let fechaEncargo: string | undefined = undefined;
    if (createPedidoDto.fechaEncargo) {
      const fechaSeleccionada = new Date(createPedidoDto.fechaEncargo);
      const fechaMinima = new Date();
      fechaMinima.setHours(fechaMinima.getHours() + 1);

      // Validar que la fecha sea al menos 1 hora en el futuro
      if (fechaSeleccionada < fechaMinima) {
        throw new BadRequestException('La fecha de encargo debe ser al menos 1 hora después de la hora actual');
      }

      fechaEncargo = fechaSeleccionada.toISOString();
    }

    // Crear pedido con detalles
    const pedido = await this.prisma.pedido.create({
      data: {
        usuarioId,
        subtotal,
        costoEnvio,
        total,
        ubicacionEnvio: createPedidoDto.ubicacionEnvio,
        fechaEncargo: fechaEncargo,
        notas: createPedidoDto.notas,
        detalles: {
          create: detalles,
        },
      },
      include: {
        detalles: {
          include: {
            producto: true,
          },
        },
        usuario: {
          select: {
            id: true,
            nombre: true,
            telefono: true,
          },
        },
      },
    });

    // Reducir stock solo si el producto tiene stock disponible
    // Los productos con permiteEncargo=true pueden tener stock 0
    for (const item of createPedidoDto.items) {
      const producto = await this.prisma.producto.findUnique({
        where: { id: item.productoId },
      });

      // Solo reducir stock si hay stock disponible
      if (producto && Number(producto.stock) > 0) {
        await this.prisma.producto.update({
          where: { id: item.productoId },
          data: {
            stock: {
              decrement: item.cantidad,
            },
          },
        });
      }
      // Si no hay stock pero permite encargo, no hacemos nada con el stock
    }

    // Notificar a todos los administradores sobre el nuevo pedido
    try {
      const admins = await this.prisma.usuario.findMany({
        where: { rol: 'ADMIN' as any },
        select: { telefono: true, nombre: true },
      });

      const mensajeAdmin = `🔔 *NUEVO PEDIDO*\n\n` +
        `Cliente: ${pedido.usuario.nombre}\n` +
        `Total: $${pedido.total}\n` +
        `Ubicación: ${pedido.ubicacionEnvio}\n` +
        `Productos: ${pedido.detalles.length} artículo(s)\n\n` +
        `⚠️ Revisa la plataforma para más detalles.`;

      for (const admin of admins) {
        try {
          await this.whatsappService.enviarMensaje(admin.telefono, mensajeAdmin);
        } catch (error) {
          console.warn(`⚠️ No se pudo enviar WhatsApp al admin ${admin.nombre}`);
        }
      }
    } catch (error) {
      console.warn('⚠️ Error al notificar admins:', error);
    }

    return pedido;
  }

  async findAll(usuarioId?: string, estado?: EstadoPedido) {
    return this.prisma.pedido.findMany({
      where: {
        ...(usuarioId && { usuarioId }),
        ...(estado && { estado }),
      },
      include: {
        detalles: {
          include: {
            producto: true,
          },
        },
        usuario: {
          select: {
            id: true,
            nombre: true,
            telefono: true,
          },
        },
        repartidor: {
          select: {
            id: true,
            nombre: true,
            telefono: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: {
        detalles: {
          include: {
            producto: true,
          },
        },
        usuario: {
          select: {
            id: true,
            nombre: true,
            telefono: true,
          },
        },
        repartidor: {
          select: {
            id: true,
            nombre: true,
            telefono: true,
          },
        },
      },
    });

    if (!pedido) {
      throw new NotFoundException(`Pedido con id ${id} no encontrado`);
    }

    return pedido;
  }

  async update(id: string, updatePedidoDto: UpdatePedidoDto) {
    await this.findOne(id);

    return this.prisma.pedido.update({
      where: { id },
      data: updatePedidoDto,
      include: {
        detalles: {
          include: {
            producto: true,
          },
        },
        usuario: true,
        repartidor: true,
      },
    });
  }

  async asignarRepartidor(id: string, repartidorId: string) {
    await this.findOne(id);

    return this.prisma.pedido.update({
      where: { id },
      data: {
        repartidorId,
        estado: EstadoPedido.EN_CAMINO,
      },
    });
  }

  async cambiarEstado(id: string, estado: EstadoPedido) {
    await this.findOne(id);

    const data: any = { estado };
    
    if (estado === EstadoPedido.ENTREGADO) {
      data.fechaEntrega = new Date();
    }

    return this.prisma.pedido.update({
      where: { id },
      data,
    });
  }

  async tomarPedido(pedidoId: string, repartidorId: string) {
    // Obtener el pedido completo con detalles
    const pedido = await this.prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: {
        usuario: true,
        detalles: {
          include: {
            producto: true,
          },
        },
      },
    });

    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }

    if (pedido.estado !== EstadoPedido.PENDIENTE) {
      throw new BadRequestException('Solo se pueden tomar pedidos pendientes');
    }

    // Obtener información del repartidor
    const repartidor = await this.prisma.usuario.findUnique({
      where: { id: repartidorId },
    });

    if (!repartidor) {
      throw new NotFoundException('Repartidor no encontrado');
    }

    // Actualizar pedido
    const pedidoActualizado = await this.prisma.pedido.update({
      where: { id: pedidoId },
      data: {
        repartidorId,
        estado: EstadoPedido.EN_PREPARACION,
      },
      include: {
        usuario: true,
        repartidor: true,
        detalles: {
          include: {
            producto: true,
          },
        },
      },
    });

    // Intentar enviar WhatsApp al cliente (no fallar si esto falla)
    try {
      const mensajeCliente = `¡Hola ${pedido.usuario.nombre}! 👋\n\n` +
        `Tu pedido está en preparación 🎉\n\n` +
        `*Detalles del pedido:*\n` +
        pedido.detalles.map(d => 
          `• ${d.producto.nombre} x${d.cantidad} - $${Number(d.subtotal).toFixed(2)}`
        ).join('\n') +
        `\n\n*Total:* $${Number(pedido.total).toFixed(2)}\n` +
        `*Ubicación de envío:* ${pedido.ubicacionEnvio || 'No especificada'}\n\n` +
        `Pronto nos comunicaremos contigo para coordinar la entrega. ✨`;

      await this.whatsappService.enviarMensaje(pedido.usuario.telefono, mensajeCliente);
    } catch (error) {
      console.warn(`⚠️ No se pudo enviar WhatsApp al cliente ${pedido.usuario.telefono}:`, error.message);
    }

    // Intentar enviar WhatsApp al repartidor (no fallar si esto falla)
    try {
      const mensajeRepartidor = `🚚 *Nuevo pedido asignado* 🚚\n\n` +
        `*Cliente:* ${pedido.usuario.nombre}\n` +
        `*Teléfono:* ${pedido.usuario.telefono}\n` +
        `*Ubicación:* ${pedido.ubicacionEnvio || 'No especificada'}\n\n` +
        `*Productos:*\n` +
        pedido.detalles.map(d => 
          `• ${d.producto.nombre} x${d.cantidad}`
        ).join('\n') +
        `\n\n*Total a cobrar:* $${Number(pedido.total).toFixed(2)}\n` +
        (pedido.fechaEncargo 
          ? `\n⏰ *Fecha de encargo:* ${new Date(pedido.fechaEncargo).toLocaleString('es-BO')}\n`
          : '') +
        (pedido.notas 
          ? `\n📝 *Notas:* ${pedido.notas}\n`
          : '') +
        `\n💬 Comunícate con el cliente para coordinar la ubicación exacta de entrega.`;

      await this.whatsappService.enviarMensaje(repartidor.telefono, mensajeRepartidor);
    } catch (error) {
      console.warn(`⚠️ No se pudo enviar WhatsApp al repartidor ${repartidor.telefono}:`, error.message);
    }

    return pedidoActualizado;
  }

  async marcarEnCamino(pedidoId: string) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: {
        usuario: true,
        repartidor: true,
      },
    });

    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }

    if (pedido.estado !== EstadoPedido.EN_PREPARACION) {
      throw new BadRequestException('Solo se pueden marcar en camino pedidos que están en preparación');
    }

    // Actualizar estado
    const pedidoActualizado = await this.prisma.pedido.update({
      where: { id: pedidoId },
      data: { estado: EstadoPedido.EN_CAMINO },
      include: {
        usuario: true,
        repartidor: true,
        detalles: {
          include: { producto: true },
        },
      },
    });

    // Intentar enviar WhatsApp al cliente (no fallar si esto falla)
    try {
      const mensajeCliente = `🚗 *Tu pedido está en camino* 🚗\n\n` +
        `Hola ${pedido.usuario.nombre},\n\n` +
        `Tu pedido está en camino y llegará pronto.\n` +
        `*Repartidor:* ${pedido.repartidor?.nombre || 'Asignado'}\n` +
        (pedido.repartidor?.telefono 
          ? `*Teléfono repartidor:* ${pedido.repartidor.telefono}\n`
          : '') +
        `\n*Total:* $${Number(pedido.total).toFixed(2)}\n\n` +
        `Gracias por tu preferencia 🙏`;

      await this.whatsappService.enviarMensaje(pedido.usuario.telefono, mensajeCliente);
    } catch (error) {
      console.warn(`⚠️ No se pudo enviar WhatsApp al cliente ${pedido.usuario.telefono}:`, error.message);
    }

    return pedidoActualizado;
  }
}
