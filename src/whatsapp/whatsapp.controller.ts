import { Controller, Get, Post } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get('estado')
  getEstado() {
    return this.whatsappService.getEstado();
  }

  @Post('reconectar')
  async reconectar() {
    await this.whatsappService.forzarReconexion();
    return { message: 'Reconexión iniciada' };
  }
}
