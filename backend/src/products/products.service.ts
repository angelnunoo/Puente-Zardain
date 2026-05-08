import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from '../../../shared/dtos';
import { Product } from '@prisma/client';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService');

  constructor(private prisma: PrismaService) {}

  // ==================== CONSULTAS PÚBLICAS ====================

  async findAll(activeOnly: boolean = false) {
    return this.prisma.product.findMany({
      where: activeOnly ? { active: true } : {},
      include: { ingredients: true },
      orderBy: { category: 'asc' },
    });
  }

  async findById(id: string, activeOnly: boolean = false) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { ingredients: true },
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    if (activeOnly && !product.active) {
      throw new NotFoundException(`Producto con ID ${id} no está activo`);
    }

    return product;
  }

  async findByCategory(category: string) {
    return this.prisma.product.findMany({
      where: { 
        category,
        active: true 
      },
      include: { ingredients: true },
      orderBy: { name: 'asc' },
    });
  }

  // ==================== GESTIÓN ADMIN ====================

  async create(createProductDto: CreateProductDto): Promise<Product> {
    try {
      this.logger.log(`Creando producto: ${createProductDto.name}`);
      
      const product = await this.prisma.product.create({
        data: {
          name: createProductDto.name,
          description: createProductDto.description,
          price: createProductDto.price,
          image: createProductDto.image,
          category: createProductDto.category,
          stock: createProductDto.stock || 50,
          active: createProductDto.active ?? true,
          ingredients: createProductDto.ingredients ? {
            create: createProductDto.ingredients.map(ing => ({
              name: ing.name,
              required: ing.required ?? true,
            }))
          } : undefined,
        },
        include: { ingredients: true },
      });

      this.logger.log(`Producto creado exitosamente: ${product.id}`);
      return product;
    } catch (error) {
      this.logger.error(`Error creando producto: ${error.message}`);
      throw new BadRequestException(`Error al crear producto: ${error.message}`);
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    try {
      this.logger.log(`Actualizando producto: ${id}`);

      // Verificar que el producto existe
      const existingProduct = await this.prisma.product.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado`);
      }

      const product = await this.prisma.product.update({
        where: { id },
        data: {
          name: updateProductDto.name,
          description: updateProductDto.description,
          price: updateProductDto.price,
          image: updateProductDto.image,
          category: updateProductDto.category,
          stock: updateProductDto.stock,
          active: updateProductDto.active,
        },
        include: { ingredients: true },
      });

      this.logger.log(`Producto actualizado exitosamente: ${id}`);
      return product;
    } catch (error) {
      this.logger.error(`Error actualizando producto: ${error.message}`);
      throw new BadRequestException(`Error al actualizar producto: ${error.message}`);
    }
  }

  async updateStock(id: string, stock: number): Promise<Product> {
    if (stock < 0) {
      throw new BadRequestException('El stock no puede ser negativo');
    }

    try {
      this.logger.log(`Actualizando stock del producto ${id} a ${stock}`);

      const product = await this.prisma.product.update({
        where: { id },
        data: { stock },
        include: { ingredients: true },
      });

      this.logger.log(`Stock actualizado: ${id} -> ${stock}`);
      return product;
    } catch (error) {
      this.logger.error(`Error actualizando stock: ${error.message}`);
      throw new BadRequestException(`Error al actualizar stock: ${error.message}`);
    }
  }

  async toggleActive(id: string): Promise<Product> {
    try {
      this.logger.log(`Cambiando estado activo del producto: ${id}`);

      const existingProduct = await this.prisma.product.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado`);
      }

      const product = await this.prisma.product.update({
        where: { id },
        data: { active: !existingProduct.active },
        include: { ingredients: true },
      });

      this.logger.log(`Producto ${id} ahora está ${product.active ? 'activo' : 'inactivo'}`);
      return product;
    } catch (error) {
      this.logger.error(`Error cambiando estado activo: ${error.message}`);
      throw new BadRequestException(`Error al cambiar estado activo: ${error.message}`);
    }
  }

  async remove(id: string): Promise<Product> {
    try {
      this.logger.log(`Eliminando producto: ${id}`);

      // Verificar si el producto tiene pedidos asociados
      const orderItemsCount = await this.prisma.orderItem.count({
        where: { productId: id },
      });

      if (orderItemsCount > 0) {
        throw new BadRequestException(
          `No se puede eliminar el producto porque tiene ${orderItemsCount} pedidos asociados. Considere desactivarlo en su lugar.`
        );
      }

      const product = await this.prisma.product.delete({
        where: { id },
        include: { ingredients: true },
      });

      this.logger.log(`Producto eliminado exitosamente: ${id}`);
      return product;
    } catch (error) {
      this.logger.error(`Error eliminando producto: ${error.message}`);
      throw new BadRequestException(`Error al eliminar producto: ${error.message}`);
    }
  }

  // ==================== MÉTRICAS Y REPORTES ====================

  async getCategories() {
    const categories = await this.prisma.product.groupBy({
      by: ['category'],
      _count: { category: true },
      where: { active: true },
    });

    return categories.map(cat => ({
      name: cat.category,
      count: cat._count.category,
    }));
  }

  async getLowStockProducts(threshold: number = 10) {
    return this.prisma.product.findMany({
      where: {
        active: true,
        stock: { lte: threshold },
      },
      include: { ingredients: true },
      orderBy: { stock: 'asc' },
    });
  }

  async getProductStats() {
    const [total, active, inactive, lowStock] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.count({ where: { active: true } }),
      this.prisma.product.count({ where: { active: false } }),
      this.prisma.product.count({ 
        where: { 
          active: true, 
          stock: { lte: 10 } 
        } 
      }),
    ]);

    return {
      total,
      active,
      inactive,
      lowStock,
      activePercentage: total > 0 ? Math.round((active / total) * 100) : 0,
    };
  }
}