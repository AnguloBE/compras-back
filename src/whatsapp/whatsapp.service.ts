import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Client, LocalAuth } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';

@Injectable()
export class WhatsappService implements OnModuleInit {
  private client: Client;
  private readonly logger = new Logger(WhatsappService.name);
  private isReady = false;
  private qrGenerado = false;
  private reconectando = false;
  private intentosReconexion = 0;
  private readonly MAX_INTENTOS_RECONEXION = 5;
  
  // Cache de mensajes enviados para evitar duplicados
  private mensajesEnviados = new Map<string, number>();
  private readonly COOLDOWN_MENSAJE = 60000; // 1 minuto entre mensajes al mismo número

  async onModuleInit() {
    await this.inicializarCliente();
  }

  private async inicializarCliente() {
    this.logger.log('Inicializando cliente de WhatsApp...');

    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: '.wwebjs_auth',
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      },
    });

    // Evento: QR generado
    this.client.on('qr', (qr) => {
      this.qrGenerado = true;
      this.isReady = false;
      this.logger.warn('⚠️  Escanea este código QR con WhatsApp:');
      qrcode.generate(qr, { small: true });
      this.logger.warn('Abre WhatsApp > Dispositivos vinculados > Vincular dispositivo');
    });

    // Evento: Autenticado correctamente
    this.client.on('authenticated', () => {
      this.logger.log('✅ Autenticación exitosa');
      this.qrGenerado = false;
    });

    // Evento: Fallo de autenticación
    this.client.on('auth_failure', (msg) => {
      this.logger.error('❌ Fallo de autenticación:', msg);
      this.isReady = false;
      this.qrGenerado = false;
      
      // Limitar intentos de reconexión
      if (this.intentosReconexion < this.MAX_INTENTOS_RECONEXION) {
        this.intentosReconexion++;
        setTimeout(() => this.reconectar(), 10000);
      } else {
        this.logger.error('⛔ Máximo de intentos de reconexión alcanzado');
      }
    });

    // Evento: Cliente listo
    this.client.on('ready', () => {
      this.isReady = true;
      this.qrGenerado = false;
      this.intentosReconexion = 0; // Resetear contador
      this.reconectando = false;
      this.logger.log('✅ WhatsApp conectado y listo!');
    });

    // Evento: Desconexión
    this.client.on('disconnected', (reason) => {
      this.isReady = false;
      this.logger.warn(`⚠️  WhatsApp desconectado: ${reason}`);
      
      // Evitar múltiples reconexiones simultáneas
      if (!this.reconectando && this.intentosReconexion < this.MAX_INTENTOS_RECONEXION) {
        this.intentosReconexion++;
        setTimeout(() => this.reconectar(), 5000);
      }
    });

    // Evento: Error
    this.client.on('error', (error) => {
      this.logger.error('❌ Error en WhatsApp:', error);
    });

    // Evento: Cargando
    this.client.on('loading_screen', (percent, message) => {
      this.logger.log(`Cargando WhatsApp: ${percent}% - ${message}`);
    });

    // Inicializar
    try {
      await this.client.initialize();
    } catch (error) {
      this.logger.error('Error al inicializar WhatsApp:', error);
      setTimeout(() => this.reconectar(), 10000);
    }
  }

  private async reconectar() {
    if (this.reconectando) {
      this.logger.warn('Ya hay una reconexión en proceso...');
      return;
    }

    this.reconectando = true;
    this.logger.log(`🔄 Intentando reconectar WhatsApp... (Intento ${this.intentosReconexion}/${this.MAX_INTENTOS_RECONEXION})`);
    
    try {
      // Destruir cliente anterior si existe
      if (this.client) {
        await this.client.destroy();
      }
    } catch (error) {
      this.logger.warn('Error al destruir cliente anterior:', error);
    }

    // Reinicializar
    await this.inicializarCliente();
  }

  async enviarCodigo(telefono: string, codigo: string): Promise<boolean> {
    if (!this.isReady) {
      this.logger.warn('WhatsApp no está listo. Código no enviado.');
      return false;
    }

    // Verificar cooldown para evitar spam
    const ahora = Date.now();
    const ultimoEnvio = this.mensajesEnviados.get(telefono);
    
    if (ultimoEnvio && (ahora - ultimoEnvio) < this.COOLDOWN_MENSAJE) {
      const tiempoRestante = Math.ceil((this.COOLDOWN_MENSAJE - (ahora - ultimoEnvio)) / 1000);
      this.logger.warn(`⏳ Cooldown activo para ${telefono}. Espera ${tiempoRestante}s`);
      return false;
    }

    try {
      // Formatear número (agregar código de país si no lo tiene)
      let numeroFormateado = telefono.replace(/\D/g, '');
      
      // Si el número tiene 10 dígitos, agregar código de México (52)
      if (numeroFormateado.length === 10) {
        numeroFormateado = '52' + numeroFormateado;
      }

      this.logger.log(`🔍 Buscando número en WhatsApp: ${numeroFormateado}`);
      
      // Obtener el ID real del número desde WhatsApp (más confiable que construirlo manualmente)
      const numberId = await this.client.getNumberId(numeroFormateado);
      
      if (!numberId) {
        this.logger.error(`❌ El número ${telefono} NO está registrado en WhatsApp`);
        return false;
      }
      
      this.logger.log(`✅ Número encontrado: ${numberId._serialized}`);

      const mensaje = `🔐 *Código de verificación Angostura*\n\nTu código es: *${codigo}*\n\nVálido por 5 minutos.\n\n_No compartas este código con nadie._`;

      await this.client.sendMessage(numberId._serialized, mensaje);
      
      // Registrar envío exitoso
      this.mensajesEnviados.set(telefono, ahora);
      
      // Limpiar cache antiguo (más de 5 minutos)
      this.limpiarCacheMensajes();
      
      this.logger.log(`✅ Código enviado a ${telefono}`);
      return true;
    } catch (error) {
      this.logger.error(`Error al enviar código a ${telefono}:`, error);
      return false;
    }
  }

  async enviarMensaje(telefono: string, mensaje: string): Promise<boolean> {
    if (!this.isReady) {
      this.logger.warn('WhatsApp no está listo. Mensaje no enviado.');
      return false;
    }

    try {
      // Formatear número (agregar código de país si no lo tiene)
      let numeroFormateado = telefono.replace(/\D/g, '');
      
      // Si el número tiene 10 dígitos, agregar código de México (52)
      if (numeroFormateado.length === 10) {
        numeroFormateado = '52' + numeroFormateado;
      }

      this.logger.log(`🔍 Buscando número en WhatsApp: ${numeroFormateado}`);
      
      // Obtener el ID real del número desde WhatsApp (más confiable que construirlo manualmente)
      const numberId = await this.client.getNumberId(numeroFormateado);
      
      if (!numberId) {
        this.logger.error(`❌ El número ${telefono} NO está registrado en WhatsApp`);
        return false;
      }
      
      this.logger.log(`✅ Número encontrado: ${numberId._serialized}`);

      await this.client.sendMessage(numberId._serialized, mensaje);
      
      this.logger.log(`✅ Mensaje enviado a ${telefono}`);
      return true;
    } catch (error) {
      this.logger.error(`Error al enviar mensaje a ${telefono}:`, error);
      return false;
    }
  }

  private limpiarCacheMensajes() {
    const ahora = Date.now();
    const TIEMPO_LIMITE = 5 * 60 * 1000; // 5 minutos
    
    for (const [telefono, timestamp] of this.mensajesEnviados.entries()) {
      if (ahora - timestamp > TIEMPO_LIMITE) {
        this.mensajesEnviados.delete(telefono);
      }
    }
  }

  getEstado(): { conectado: boolean; esperandoQR: boolean } {
    return {
      conectado: this.isReady,
      esperandoQR: this.qrGenerado,
    };
  }

  async forzarReconexion(): Promise<void> {
    this.logger.log('🔄 Reconexión forzada solicitada');
    this.intentosReconexion = 0; // Resetear contador para permitir reconexión
    await this.reconectar();
  }
}
