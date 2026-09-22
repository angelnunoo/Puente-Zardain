import { WsException } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { EventBusService } from '../common/events/event-bus.service';

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

describe('ChatGateway', () => {
  const chatService = {
    assertCanAccessOrder: jest.fn(),
    saveMessage: jest.fn(),
  };
  const eventBus = { on: jest.fn() };
  const jwtService = { verify: jest.fn() };
  let gateway: ChatGateway;
  let emit: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    gateway = new ChatGateway(
      chatService as unknown as ChatService,
      eventBus as unknown as EventBusService,
      jwtService as unknown as JwtService,
    );
    emit = jest.fn();
    gateway.server = { to: jest.fn().mockReturnValue({ emit }) } as any;
  });

  it('disconnects sockets that do not present a valid token', () => {
    jwtService.verify.mockImplementation(() => {
      throw new Error('invalid');
    });
    const client = socket({ auth: { token: 'bad' } });

    gateway.handleConnection(client as any);

    expect(client.disconnect).toHaveBeenCalledWith(true);
    expect(client.data.user).toBeUndefined();
  });

  it('keeps the authenticated user on the socket', () => {
    jwtService.verify.mockReturnValue({ sub: 'owner', email: 'a@b.c', role: 'USER' });
    const client = socket({ auth: { token: 'good' } });

    gateway.handleConnection(client as any);

    expect(client.data.user).toEqual({ userId: 'owner', email: 'a@b.c', role: 'USER' });
    expect(client.disconnect).not.toHaveBeenCalled();
  });

  it('refuses to join a room without an authenticated user', async () => {
    const client = socket();

    await expect(gateway.handleJoin({ orderId: 'order-1' }, client as any)).rejects.toBeInstanceOf(WsException);
    expect(chatService.assertCanAccessOrder).not.toHaveBeenCalled();
    expect(client.join).not.toHaveBeenCalled();
  });

  it('joins only after the order access check succeeds', async () => {
    chatService.assertCanAccessOrder.mockResolvedValue({ userId: 'owner' });
    const client = socket();
    client.data.user = { userId: 'owner', role: 'USER' };

    await gateway.handleJoin({ orderId: 'order-1' }, client as any);

    expect(chatService.assertCanAccessOrder).toHaveBeenCalledWith('order-1', client.data.user);
    expect(client.join).toHaveBeenCalledWith('order-1');
  });

  it('does not persist a message when the sender is not authenticated', async () => {
    const client = socket();

    await expect(
      gateway.handleMessage({ orderId: 'order-1', sender: 'admin', content: 'cancelado' }, client as any),
    ).rejects.toBeInstanceOf(WsException);
    expect(chatService.saveMessage).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
  });

  it('passes the authenticated actor and ignores a spoofed sender', async () => {
    const saved = { id: 'm1', sender: 'Cliente', content: 'hola' };
    chatService.saveMessage.mockResolvedValue(saved);
    const client = socket();
    client.data.user = { userId: 'owner', role: 'USER' };

    const result = await gateway.handleMessage(
      { orderId: 'order-1', sender: 'admin', content: 'hola' },
      client as any,
    );

    expect(chatService.saveMessage).toHaveBeenCalledWith(
      { orderId: 'order-1', content: 'hola' },
      client.data.user,
    );
    expect(result).toBe(saved);
    expect(emit).toHaveBeenCalledWith('newMessage', saved);
  });
});

function socket(handshake: { auth?: { token?: string }; headers?: Record<string, string> } = {}) {
  return {
    handshake,
    data: {} as { user?: { userId: string; role?: string; email?: string } },
    disconnect: jest.fn(),
    join: jest.fn(),
    emit: jest.fn(),
  };
}
