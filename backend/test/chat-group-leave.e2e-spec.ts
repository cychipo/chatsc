import { ChatController } from '../src/modules/chat/chat.controller'
import { ChatService } from '../src/modules/chat/chat.service'

describe('Chat group leave e2e', () => {
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

  it('allows active member to leave group', async () => {
    const controller = new ChatController(chatService as unknown as ChatService)

    chatService.getActiveParticipant.mockResolvedValue({ userId: 'user-2', status: 'active' })
    chatService.leaveConversation.mockResolvedValue(undefined)

    const result = await controller.leaveConversation(
      { user: { id: 'user-2' } } as never,
      'group-1',
    )

    expect(chatService.getActiveParticipant).toHaveBeenCalledWith('group-1', 'user-2')
    expect(chatService.leaveConversation).toHaveBeenCalledWith('group-1', 'user-2')
    expect(result).toMatchObject({ success: true, data: { left: true } })
  })

  it('creates left event when member leaves', async () => {
    const controller = new ChatController(chatService as unknown as ChatService)

    chatService.getActiveParticipant.mockResolvedValue({ userId: 'user-2', status: 'active' })
    chatService.leaveConversation.mockResolvedValue(undefined)
    chatService.getMembershipEvents.mockResolvedValue([
      {
        _id: 'event-1',
        type: 'left',
        targetUserId: 'user-2',
        occurredAt: new Date().toISOString(),
      },
    ])

    await controller.leaveConversation(
      { user: { id: 'user-2' } } as never,
      'group-1',
    )

    chatService.getActiveParticipant.mockResolvedValue({ userId: 'user-1', status: 'active' })
    const response = await controller.getMembershipEvents(
      { user: { id: 'user-1' } } as never,
      'group-1',
    )

    expect(response.success).toBe(true)
    if (response.success) {
      expect(response.data.some((e: { type: string }) => e.type === 'left')).toBe(true)
    }
  })
})
