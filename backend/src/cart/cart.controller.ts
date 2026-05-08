import { Body, Controller, Get, Put, Post, Delete, Req, UseGuards, Param } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateCartDto } from './dto/update-cart.dto';
import { AddToCartDto } from './dto/add-to-cart.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  getCart(@Req() req: any) {
    return this.cartService.getCart(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('items')
  addToCart(@Req() req: any, @Body() payload: AddToCartDto) {
    return this.cartService.addToCart(req.user.userId, payload);
  }

  @UseGuards(JwtAuthGuard)
  @Put('items/:productId')
  updateCartItem(
    @Req() req: any, 
    @Param('productId') productId: string,
    @Body() payload: UpdateCartDto
  ) {
    return this.cartService.updateCartItem(req.user.userId, productId, payload);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('items/:productId')
  removeFromCart(@Req() req: any, @Param('productId') productId: string) {
    return this.cartService.removeFromCart(req.user.userId, productId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete()
  clearCart(@Req() req: any) {
    return this.cartService.clearCart(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  checkout(@Req() req: any, @Body() payload: { deliveryAddress?: string; notes?: string }) {
    return this.cartService.checkout(req.user.userId, payload);
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders')
  getOrders(@Req() req: any) {
    return this.cartService.getUserOrders(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders/:orderId')
  getOrder(@Req() req: any, @Param('orderId') orderId: string) {
    return this.cartService.getOrder(req.user.userId, orderId);
  }
}
