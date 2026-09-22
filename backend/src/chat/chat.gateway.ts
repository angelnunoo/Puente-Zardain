import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, ConnectedSocket, OnGatewayConnection, WsException } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatActor, ChatService } from './chat.service';
import { DomainEventPayload, EventBusService } from '../common/events/event-bus.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(
    private chatService: ChatService,
    private eventBus: EventBusService,
    private jwtService: JwtService,
  ) {
    this.eventBus.on('OrderStatusChanged', this.handleOrderStatusChanged.bind(this));
  }

  handleConnection(client: Socket) {
    const token = this.extractToken(client);
    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwtService.verify<{ sub?: string; email?: string; role?: string }>(token);
      if (!payload?.sub) {
        client.disconnect(true);
        return;
      }
      client.data.user = {
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
      } satisfies ChatActor & { email?: string };
    } catch {
      client.disconnect(true);
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoin(
    @MessageBody() data: { orderId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const actor = this.requireActor(client);
    const orderId = this.requireOrderId(data?.orderId);
    await this.chatService.assertCanAccessOrder(orderId, actor);
    client.join(orderId);
    client.emit('joined', { orderId });
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { orderId?: string; sender?: string; content?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const actor = this.requireActor(client);
    const orderId = this.requireOrderId(data?.orderId);
    const message = await this.chatService.saveMessage(
      { orderId, content: data?.content ?? '' },
      actor,
    );
    this.server.to(orderId).emit('newMessage', message);
    return message;
  }

  private handleOrderStatusChanged(payload: DomainEventPayload) {
    const orderId = payload.orderId;
    if (typeof orderId !== 'string' || !this.server) {
      return;
    }
    this.server.to(orderId).emit('orderStatusUpdated', payload);
  }

  private requireActor(client: Socket): ChatActor {
    const actor = client.data?.user as ChatActor | undefined;
    if (!actor?.userId) {
      throw new WsException('Unauthorized');
    }
    return actor;
  }

  private requireOrderId(orderId: string | undefined): string {
    if (!orderId || typeof orderId !== 'string') {
      throw new WsException('Pedido inválido');
    }
    return orderId;
  }

  private extractToken(client: Socket): string | undefined {
    const authToken = client.handshake?.auth?.token;
    if (typeof authToken === 'string' && authToken.trim()) {
      return authToken.trim();
    }

    const header = client.handshake?.headers?.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      const token = header.slice('Bearer '.length).trim();
      return token || undefined;
    }

    return undefined;
  }
}
