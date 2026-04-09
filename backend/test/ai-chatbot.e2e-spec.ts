import { ChatGateway } from '../src/modules/chat/chat.gateway'

describe('AI chatbot integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('sends chat message even when moderation and chatbot fail', async () => {
    const gateway = Object.create(ChatGateway.prototype) as ChatGateway
    const emit = jest.fn()

    Object.assign(gateway as object, {
      chatService: {
        sendRealtimeMessage: jest.fn().mockResolvedValue({
          message: {
            messageId: 'msg-1',
            conversationId: 'conv-1',
            senderId: 'user-1',
            content: '/ai hello',
            sentAt: '2026-04-08T10:00:00.000Z',
          },
          previewByUserId: [{ userId: 'user-1', preview: { conversationId: 'conv-1' } }],
        }),
      },
      authService: {},
      aiConfigService: {
        isModerationEnabled: jest.fn().mockReturnValue(true),
        isChatbotEnabled: jest.fn().mockReturnValue(true),
      },
      aiChatbotService: {
        shouldReply: jest.fn().mockReturnValue(true),
        generateResponse: jest.fn().mockRejectedValue(new Error('AI unavailable')),
      },
      aiModerationService: {
        analyzeMessage: jest.fn().mockRejectedValue(new Error('AI timeout')),
      },
      emitConversationPreviews: jest.fn().mockResolvedValue(undefined),
      emitRealtimeMessage: jest.fn().mockResolvedValue(undefined),
      getClientUser: jest.fn().mockReturnValue({ id: 'user-1' }),
      server: { to: jest.fn().mockReturnValue({ emit }) },
      toErrorAck: jest.fn(),
    })

    const result = await gateway.handleSendMessage({ data: { user: { id: 'user-1' } } } as never, {
      conversationId: 'conv-1',
      content: '/ai hello',
    })

    expect(result).toEqual({
      success: true,
      data: expect.objectContaining({ messageId: 'msg-1', content: '/ai hello' }),
    })
    expect((gateway as unknown as {
      chatService: { sendRealtimeMessage: jest.Mock }
    }).chatService.sendRealtimeMessage).toHaveBeenCalledWith('conv-1', 'user-1', '/ai hello', undefined, true)
  })
})
