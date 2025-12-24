import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { PrismaService } from '../prisma/prisma.service';
import sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProductosService {
  private readonly uploadsPath = path.join(process.cwd(), 'uploads', 'productos');

  constructor(private prisma: PrismaService) {}

  private async procesarImagen(file: Express.Multer.File): Promise<string> {
    const filename = `${uuidv4()}.webp`;
    const filepath = path.join(this.uploadsPath, filename);

    // Solo redimensiona si es más grande que 800x800, mantiene aspect ratio original
    await sharp(file.buffer)
      .resize(800, 800, { 
        fit: 'inside',
        withoutEnlargement: true,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .flatten({ background: { r: 255, g: 255, b: 255 } }) // Convierte transparencia a blanco
      .webp({ quality: 85 })
      .toFile(filepath);

    return filename;
  }

  private async eliminarImagen(filename: string): Promise<void> {
    if (filename) {
      try {
        await fs.unlink(path.join(this.uploadsPath, filename));
      } catch (error) {
        // Ignorar si el archivo no existe
      }
    }
  }

  async create(createProductoDto: CreateProductoDto, file?: Express.Multer.File) {
    let imagen: string | undefined;

    if (file) {
      imagen = await this.procesarImagen(file);
    }

    return this.prisma.producto.create({
      data: {
        ...createProductoDto,
        imagen,
      },
      include: {
        categoria: true,
      },
    });
  }

  async findAll(categoriaId?: string, includeInactive: boolean = false) {
    return this.prisma.producto.findMany({
      where: {
        ...(includeInactive ? {} : { activo: true }),
        ...(categoriaId && { categoriaId }),
      },
      include: {
        categoria: true,
      },
      orderBy: {
        nombre: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const producto = await this.prisma.producto.findUnique({
      where: { id },
      include: {
        categoria: true,
      },
    });

    if (!producto) {
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }

    return producto;
  }

  async update(id: string, updateProductoDto: UpdateProductoDto, file?: Express.Multer.File) {
    const productoActual = await this.findOne(id);
    let imagen: string | undefined;

    if (file) {
      // Procesar nueva imagen
      imagen = await this.procesarImagen(file);
      
      // Eliminar imagen anterior si existe
      if (productoActual.imagen) {
        await this.eliminarImagen(productoActual.imagen);
      }
    }

    return this.prisma.producto.update({
      where: { id },
      data: {
        ...updateProductoDto,
        ...(imagen && { imagen }),
      },
      include: {
        categoria: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.producto.update({
      where: { id },
      data: { activo: false },
    });
  }

  async findByBarcode(codigoBarras: string) {
    const producto = await this.prisma.producto.findFirst({
      where: { 
        codigoBarras,
        activo: true,
      },
      include: {
        categoria: true,
      },
    });

    if (!producto) {
      throw new NotFoundException(`Producto con código de barras ${codigoBarras} no encontrado`);
    }

    return producto;
  }

  async updateStock(id: string, cantidad: number) {
    const producto = await this.findOne(id);
    const nuevoStock = Number(producto.stock) + cantidad;

    return this.prisma.producto.update({
      where: { id },
      data: {
        stock: nuevoStock,
      },
      include: {
        categoria: true,
      },
    });
  }
}
