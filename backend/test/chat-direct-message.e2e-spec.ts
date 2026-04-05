import { ForbiddenException } from '@nestjs/common'
import { ChatController } from '../src/modules/chat/chat.controller'
import { ChatService } from '../src/modules/chat/chat.service'

describe('Chat direct message e2e', () => {
  const chatService = {
    listConversationsForUser: jest.fn(),
    createConversation: jest.fn(),
    getActiveParticipant: jest.fn(),
    sendMessage: jest.fn(),
    getMessages: jest.fn(),
    addMember: jest.fn(),
    removeMember: jest.fn(),
    leaveConversation: jest.fn(),
    getMembershipEvents: jest.fn(),
    getParticipantRole: jest.fn(),
    getActiveParticipants: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates a direct conversation between two users', async () => {
    const controller = new ChatController(chatService as unknown as ChatService)

    chatService.createConversation.mockResolvedValue({
      _id: 'conv-1',
      type: 'direct',
      createdBy: 'user-1',
    })

    const result = await controller.createConversation(
      { user: { id: 'user-1' } } as never,
      { type: 'direct', participantIds: ['user-2'] },
    )

    expect(chatService.createConversation).toHaveBeenCalledWith('direct', 'user-1', ['user-2'], undefined)
    expect(result).toMatchObject({ success: true, data: { type: 'direct' } })
  })

  it('sends a message and receives the created message', async () => {
    const controller = new ChatController(chatService as unknown as ChatService)

    chatService.getActiveParticipant.mockResolvedValue({ userId: 'user-1', status: 'active' })
    chatService.sendMessage.mockResolvedValue({
      _id: 'msg-1',
      conversationId: 'conv-1',
      senderId: 'user-1',
      content: 'Hello',
      deliveryStatus: 'sent',
    })

    const encoder = new TextEncoder()
    const binaryContent = encoder.encode('Hello')

    const result = await controller.sendMessage(
      { user: { id: 'user-1' }, body: Buffer.from(binaryContent) } as never,
      'conv-1',
    )

    expect(chatService.getActiveParticipant).toHaveBeenCalledWith('conv-1', 'user-1')
    expect(chatService.sendMessage).toHaveBeenCalledWith('conv-1', 'user-1', 'Hello')
    expect(result).toMatchObject({ success: true, data: { content: 'Hello', deliveryStatus: 'sent' } })
  })

  it('lists messages for a conversation', async () => {
    const controller = new ChatController(chatService as unknown as ChatService)

    chatService.getActiveParticipant.mockResolvedValue({ userId: 'user-1', status: 'active' })
    chatService.getMessages.mockResolvedValue([
      { _id: 'msg-1', content: 'Hello' },
      { _id: 'msg-2', content: 'World' },
    ])

    const response = await controller.getMessages(
      { user: { id: 'user-1' } } as never,
      'conv-1',
      {},
    )

    expect(chatService.getMessages).toHaveBeenCalledWith('conv-1', undefined, 10)
    expect(response.success).toBe(true)
    if (response.success) {
      expect(response.data).toHaveLength(2)
    }
  })

  it('rejects sending message if user is not active participant', async () => {
    const controller = new ChatController(chatService as unknown as ChatService)

    chatService.getActiveParticipant.mockResolvedValue(null)

    const encoder = new TextEncoder()
    const binaryContent = encoder.encode('Hello')

    await expect(
      controller.sendMessage(
        { user: { id: 'user-1' }, body: Buffer.from(binaryContent) } as never,
        'conv-1',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })
})
