import { WebSocketGateway, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { ChatService } from './chat.service';

@WebSocketGateway()
export class ChatGateway {
  constructor(private chatService: ChatService) {}

  @SubscribeMessage('sendMessage')
  handleMessage(@MessageBody() data: { orderId: string; sender: string; content: string }) {
    this.chatService.saveMessage(data);
    // Emit to room
  }
}