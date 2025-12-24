import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SolicitarCodigoDto, VerificarCodigoDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('solicitar-codigo')
  async solicitarCodigo(@Body() dto: SolicitarCodigoDto) {
    return this.authService.solicitarCodigo(dto.telefono, dto.nombre);
  }

  @Post('verificar-codigo')
  async verificarCodigo(@Body() dto: VerificarCodigoDto) {
    return this.authService.verificarCodigo(dto.telefono, dto.codigo);
  }

  @Get('perfil')
  @UseGuards(JwtAuthGuard)
  async obtenerPerfil(@Request() req) {
    return this.authService.obtenerPerfil(req.user.sub);
  }
}

