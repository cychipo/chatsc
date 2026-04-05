import { ForbiddenException } from '@nestjs/common'
import { ChatController } from '../src/modules/chat/chat.controller'
import { ChatService } from '../src/modules/chat/chat.service'

describe('Chat group forbidden send e2e', () => {
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

  it('rejects message from user who left the group', async () => {
    const controller = new ChatController(chatService as unknown as ChatService)

    chatService.getActiveParticipant.mockResolvedValue(null)

    const encoder = new TextEncoder()
    const binaryContent = encoder.encode('Hello')

    await expect(
      controller.sendMessage(
        { user: { id: 'left-user' }, body: Buffer.from(binaryContent) } as never,
        'group-1',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException)

    expect(chatService.sendMessage).not.toHaveBeenCalled()
  })

  it('rejects message from user who was removed', async () => {
    const controller = new ChatController(chatService as unknown as ChatService)

    chatService.getActiveParticipant.mockResolvedValue(null)

    const encoder = new TextEncoder()
    const binaryContent = encoder.encode('I was removed')

    await expect(
      controller.sendMessage(
        { user: { id: 'removed-user' }, body: Buffer.from(binaryContent) } as never,
        'group-1',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('allows message from active participant', async () => {
    const controller = new ChatController(chatService as unknown as ChatService)

    chatService.getActiveParticipant.mockResolvedValue({ userId: 'active-user', status: 'active' })
    chatService.sendMessage.mockResolvedValue({
      _id: 'msg-1',
      content: 'Active message',
      deliveryStatus: 'sent',
    })

    const encoder = new TextEncoder()
    const binaryContent = encoder.encode('Active message')

    const result = await controller.sendMessage(
      { user: { id: 'active-user' }, body: Buffer.from(binaryContent) } as never,
      'group-1',
    )

    expect(chatService.sendMessage).toHaveBeenCalledWith('group-1', 'active-user', 'Active message')
    expect(result).toMatchObject({ success: true, data: { deliveryStatus: 'sent' } })
  })

  it('rejects read messages from non-active participant', async () => {
    const controller = new ChatController(chatService as unknown as ChatService)

    chatService.getActiveParticipant.mockResolvedValue(null)

    await expect(
      controller.getMessages(
        { user: { id: 'non-member' } } as never,
        'group-1',
        {},
      ),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })
})
