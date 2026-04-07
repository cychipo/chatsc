import { ForbiddenException } from '@nestjs/common'
import { ChatService } from '../src/modules/chat/chat.service'

describe('Chat realtime permission checks', () => {
  const chatService = {
    sendMessage: jest.fn(),
    buildConversationPreviewPayloads: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('rejects message from user who left the group', async () => {
    const service = Object.create(ChatService.prototype) as ChatService
    Object.assign(service, chatService)

    chatService.sendMessage.mockRejectedValue(new ForbiddenException())

    await expect(service.sendRealtimeMessage('group-1', 'left-user', 'Hello')).rejects.toBeInstanceOf(ForbiddenException)
    expect(chatService.sendMessage).toHaveBeenCalledWith('group-1', 'left-user', 'Hello')
  })

  it('allows message from active participant', async () => {
    const service = Object.create(ChatService.prototype) as ChatService
    Object.assign(service, chatService)
    service.toRealtimeMessagePayload = jest.fn().mockResolvedValue({
      messageId: 'msg-1',
      conversationId: 'group-1',
      senderId: 'active-user',
      content: 'Active message',
      sentAt: '2026-04-05T10:00:00.000Z',
    }) as never

    chatService.sendMessage.mockResolvedValue({
      message: {
        _id: { toString: () => 'msg-1' },
        conversationId: { toString: () => 'group-1' },
        senderId: { toString: () => 'active-user' },
        content: 'Active message',
        sentAt: new Date('2026-04-05T10:00:00.000Z'),
      },
      restoredParticipants: [],
    })
    chatService.buildConversationPreviewPayloads.mockResolvedValue([
      {
        userId: 'active-user',
        preview: {
          conversationId: 'group-1',
          lastMessagePreview: 'Active message',
          lastMessageAt: '2026-04-05T10:00:00.000Z',
          unreadCount: 0,
          hasUnread: false,
        },
      },
    ])

    const result = await service.sendRealtimeMessage('group-1', 'active-user', 'Active message')

    expect(chatService.sendMessage).toHaveBeenCalledWith('group-1', 'active-user', 'Active message')
    expect(chatService.buildConversationPreviewPayloads).toHaveBeenCalledWith('group-1')
    expect(result).toMatchObject({
      message: { content: 'Active message' },
      previewByUserId: [
        {
          userId: 'active-user',
          preview: { conversationId: 'group-1', lastMessagePreview: 'Active message' },
        },
      ],
      restoredParticipants: [],
    })
  })
})
