import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { EventBusService } from '../common/events/event-bus.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private chatService: ChatService, private eventBus: EventBusService) {
    this.eventBus.on('OrderStatusChanged', this.handleOrderStatusChanged.bind(this));
  }

  @SubscribeMessage('joinRoom')
  handleJoin(
    @MessageBody() data: { orderId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.orderId);
    client.emit('joined', { orderId: data.orderId });
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(@MessageBody() data: { orderId: string; sender: string; content: string }) {
    const message = await this.chatService.saveMessage(data);
    this.server.to(data.orderId).emit('newMessage', message);
    return message;
  }

  private handleOrderStatusChanged(payload: { orderId: string; previousStatus: string; newStatus: string }) {
    this.server.to(payload.orderId).emit('orderStatusUpdated', payload);
  }
}