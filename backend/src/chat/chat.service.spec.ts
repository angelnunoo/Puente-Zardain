import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ChatService } from './chat.service';

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

const mockPrismaService = {
  order: {
    findUnique: jest.fn(),
  },
  chat: {
    findUnique: jest.fn(),
  },
  message: {
    create: jest.fn(),
  },
};

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  it('returns messages only to the order owner', async () => {
    mockPrismaService.order.findUnique.mockResolvedValue({ userId: 'owner' });
    mockPrismaService.chat.findUnique.mockResolvedValue({
      id: 'chat-1',
      messages: [{ id: 'm1', content: 'hola', sender: 'Cliente' }],
    });

    const messages = await service.getMessages('order-1', { userId: 'owner', role: 'USER' });

    expect(messages).toEqual([{ id: 'm1', content: 'hola', sender: 'Cliente' }]);
  });

  it('rejects another customer reading the chat', async () => {
    mockPrismaService.order.findUnique.mockResolvedValue({ userId: 'owner' });

    await expect(
      service.getMessages('order-1', { userId: 'intruder', role: 'USER' }),
    ).rejects.toThrow(ForbiddenException);
    expect(mockPrismaService.chat.findUnique).not.toHaveBeenCalled();
  });

  it('lets an admin read a customer chat', async () => {
    mockPrismaService.order.findUnique.mockResolvedValue({ userId: 'owner' });
    mockPrismaService.chat.findUnique.mockResolvedValue({ id: 'chat-1', messages: [] });

    await expect(
      service.getMessages('order-1', { userId: 'admin-1', role: 'ADMIN' }),
    ).resolves.toEqual([]);
  });

  it('does not write a message into another customer chat', async () => {
    mockPrismaService.order.findUnique.mockResolvedValue({ userId: 'owner' });

    await expect(
      service.saveMessage(
        { orderId: 'order-1', content: 'soy el restaurante' },
        { userId: 'intruder', role: 'USER' },
      ),
    ).rejects.toThrow(ForbiddenException);
    expect(mockPrismaService.message.create).not.toHaveBeenCalled();
  });

  it('stores the customer label instead of a client-supplied sender', async () => {
    mockPrismaService.order.findUnique.mockResolvedValue({ userId: 'owner' });
    mockPrismaService.chat.findUnique.mockResolvedValue({ id: 'chat-1' });
    mockPrismaService.message.create.mockImplementation(async ({ data }) => data);

    const message = await service.saveMessage(
      { orderId: 'order-1', content: '  ¿va en camino?  ' },
      { userId: 'owner', role: 'USER' },
    );

    expect(message).toEqual({
      chatId: 'chat-1',
      sender: 'Cliente',
      content: '¿va en camino?',
    });
  });

  it('labels admin messages as admin', async () => {
    mockPrismaService.order.findUnique.mockResolvedValue({ userId: 'owner' });
    mockPrismaService.chat.findUnique.mockResolvedValue({ id: 'chat-1' });
    mockPrismaService.message.create.mockImplementation(async ({ data }) => data);

    const message = await service.saveMessage(
      { orderId: 'order-1', content: 'Sale en 5 minutos' },
      { userId: 'admin-1', role: 'ADMIN' },
    );

    expect(message.sender).toBe('admin');
  });

  it('hides missing orders as not found', async () => {
    mockPrismaService.order.findUnique.mockResolvedValue(null);

    await expect(
      service.getMessages('missing', { userId: 'owner', role: 'USER' }),
    ).rejects.toThrow(NotFoundException);
  });
});
