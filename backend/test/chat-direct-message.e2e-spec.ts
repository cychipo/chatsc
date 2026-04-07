import { ForbiddenException } from '@nestjs/common'
import { ChatService } from '../src/modules/chat/chat.service'

describe('Chat realtime send service', () => {
  const chatService = {
    sendMessage: jest.fn(),
    buildConversationPreviewPayloads: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates realtime payload for active participant', async () => {
    const service = Object.create(ChatService.prototype) as ChatService
    Object.assign(service, chatService)
    service.toRealtimeMessagePayload = jest.fn().mockResolvedValue({
      messageId: 'msg-1',
      conversationId: 'conv-1',
      senderId: 'user-1',
      content: 'Hello',
      sentAt: '2026-04-05T10:00:00.000Z',
    }) as never

    chatService.sendMessage.mockResolvedValue({
      message: {
        _id: { toString: () => 'msg-1' },
        conversationId: { toString: () => 'conv-1' },
        senderId: { toString: () => 'user-1' },
        content: 'Hello',
        sentAt: new Date('2026-04-05T10:00:00.000Z'),
      },
      restoredParticipants: [],
    })
    chatService.buildConversationPreviewPayloads.mockResolvedValue([
      {
        userId: 'user-1',
        preview: {
          conversationId: 'conv-1',
          lastMessagePreview: 'Hello',
          lastMessageAt: '2026-04-05T10:00:00.000Z',
          unreadCount: 0,
          hasUnread: false,
        },
      },
    ])

    const result = await service.sendRealtimeMessage('conv-1', 'user-1', 'Hello')

    expect(chatService.sendMessage).toHaveBeenCalledWith('conv-1', 'user-1', 'Hello')
    expect(chatService.buildConversationPreviewPayloads).toHaveBeenCalledWith('conv-1')
    expect(result).toMatchObject({
      message: { content: 'Hello', senderId: 'user-1' },
      previewByUserId: [
        {
          userId: 'user-1',
          preview: { conversationId: 'conv-1', lastMessagePreview: 'Hello' },
        },
      ],
      restoredParticipants: [],
    })
  })

  it('bubbles forbidden error for non participant', async () => {
    const service = Object.create(ChatService.prototype) as ChatService
    Object.assign(service, chatService)

    chatService.sendMessage.mockRejectedValue(new ForbiddenException())

    await expect(service.sendRealtimeMessage('conv-1', 'user-1', 'Hello')).rejects.toBeInstanceOf(ForbiddenException)
  })
})
