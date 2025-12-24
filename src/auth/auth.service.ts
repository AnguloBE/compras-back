import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private whatsappService: WhatsappService,
  ) {}

  // Generar código de 6 dígitos
  private generarCodigo(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async solicitarCodigo(telefono: string, nombre?: string) {
    const codigo = this.generarCodigo();
    const expiracion = new Date();
    expiracion.setMinutes(expiracion.getMinutes() + 5); // Expira en 5 minutos

    // Buscar usuario existente
    let usuario = await this.prisma.usuario.findUnique({
      where: { telefono },
    });

    if (usuario) {
      // Usuario existe - solo actualizar código (login)
      usuario = await this.prisma.usuario.update({
        where: { telefono },
        data: {
          codigoVerificacion: codigo,
          codigoExpiracion: expiracion,
        },
      });
    } else {
      // Usuario nuevo - requiere nombre (registro)
      if (!nombre) {
        throw new UnauthorizedException('El nombre es requerido para registrarse');
      }
      
      usuario = await this.prisma.usuario.create({
        data: {
          nombre,
          telefono,
          codigoVerificacion: codigo,
          codigoExpiracion: expiracion,
        },
      });
    }

    // Enviar código por WhatsApp
    const enviado = await this.whatsappService.enviarCodigo(telefono, codigo);
    
    if (!enviado) {
      console.log(`⚠️  WhatsApp no disponible. Código para ${telefono}: ${codigo}`);
    }

    return {
      message: enviado ? 'Código enviado por WhatsApp' : 'Código generado (WhatsApp no disponible)',
      esNuevoUsuario: !usuario.createdAt || usuario.createdAt === usuario.updatedAt,
      whatsappDisponible: enviado,
      // Solo en desarrollo:
      codigoDesarrollo: process.env.NODE_ENV === 'development' ? codigo : undefined,
    };
  }

  async verificarCodigo(telefono: string, codigo: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { telefono },
    });

    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    if (!usuario.codigoVerificacion || !usuario.codigoExpiracion) {
      throw new UnauthorizedException('No hay código pendiente');
    }

    // Verificar si el código expiró
    if (new Date() > usuario.codigoExpiracion) {
      throw new UnauthorizedException('El código ha expirado');
    }

    // Verificar si el código es correcto
    if (usuario.codigoVerificacion !== codigo) {
      throw new UnauthorizedException('Código incorrecto');
    }

    // Limpiar código después de usarlo
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        codigoVerificacion: null,
        codigoExpiracion: null,
      },
    });

    // Generar JWT
    const payload = {
      sub: usuario.id,
      telefono: usuario.telefono,
      rol: usuario.rol,
    };

    const token = this.jwtService.sign(payload);

    return {
      accessToken: token,
      usuario: {
        id: usuario.id,
        telefono: usuario.telefono,
        nombre: usuario.nombre,
        rol: usuario.rol,
      },
    };
  }

  async obtenerPerfil(usuarioId: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        telefono: true,
        nombre: true,
        fechaNacimiento: true,
        rol: true,
        createdAt: true,
      },
    });

    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return usuario;
  }
}

