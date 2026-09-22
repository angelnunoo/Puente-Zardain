import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

describe('ChatController', () => {
  it('loads history for the authenticated user, not an id from the query', async () => {
    const chatService = {
      getMessages: jest.fn().mockResolvedValue([{ id: 'm1' }]),
    };
    const controller = new ChatController(chatService as unknown as ChatService);
    const user = { userId: 'owner', role: 'USER' };

    await expect(controller.getHistory('order-1', { user })).resolves.toEqual([{ id: 'm1' }]);
    expect(chatService.getMessages).toHaveBeenCalledWith('order-1', user);
  });
});
