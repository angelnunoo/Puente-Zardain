import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatActor, ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(JwtAuthGuard)
  @Get('history/:orderId')
  getHistory(@Param('orderId') orderId: string, @Req() req: { user: ChatActor }) {
    return this.chatService.getMessages(orderId, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('quick-replies')
  getQuickReplies() {
    return this.chatService.getQuickReplies();
  }
}
