import { ForbiddenException } from '@nestjs/common'
import { ChatService } from '../src/modules/chat/chat.service'

describe('Chat realtime send service', () => {
  const chatService = {
    getRequiredActiveParticipant: jest.fn(),
    sendMessage: jest.fn(),
    toRealtimeMessagePayload: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates realtime payload for active participant', async () => {
    const service = Object.create(ChatService.prototype) as ChatService
    Object.assign(service, chatService)

    chatService.getRequiredActiveParticipant.mockResolvedValue({ userId: 'user-1', status: 'active' })
    chatService.sendMessage.mockResolvedValue({
      _id: { toString: () => 'msg-1' },
      conversationId: { toString: () => 'conv-1' },
      senderId: { toString: () => 'user-1' },
      content: 'Hello',
      sentAt: new Date('2026-04-05T10:00:00.000Z'),
    })
    chatService.toRealtimeMessagePayload.mockReturnValue({
      messageId: 'msg-1',
      conversationId: 'conv-1',
      senderId: 'user-1',
      content: 'Hello',
      sentAt: '2026-04-05T10:00:00.000Z',
    })

    const result = await service.sendRealtimeMessage('conv-1', 'user-1', 'Hello')

    expect(chatService.getRequiredActiveParticipant).toHaveBeenCalledWith('conv-1', 'user-1')
    expect(chatService.sendMessage).toHaveBeenCalledWith('conv-1', 'user-1', 'Hello')
    expect(result).toMatchObject({ content: 'Hello', senderId: 'user-1' })
  })

  it('bubbles forbidden error for non participant', async () => {
    const service = Object.create(ChatService.prototype) as ChatService
    Object.assign(service, chatService)

    chatService.getRequiredActiveParticipant.mockRejectedValue(new ForbiddenException())

    await expect(service.sendRealtimeMessage('conv-1', 'user-1', 'Hello')).rejects.toBeInstanceOf(ForbiddenException)
  })
})
