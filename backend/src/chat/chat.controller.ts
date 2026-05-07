import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(JwtAuthGuard)
  @Get('history/:orderId')
  getHistory(@Param('orderId') orderId: string) {
    return this.chatService.getMessages(orderId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('quick-replies')
  getQuickReplies() {
    return this.chatService.getQuickReplies();
  }
}
