import { ChatController } from '../src/modules/chat/chat.controller'
import { ChatService } from '../src/modules/chat/chat.service'

describe('Chat group membership events e2e', () => {
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

  it('creates a group conversation with initial members', async () => {
    const controller = new ChatController(chatService as unknown as ChatService)

    chatService.createConversation.mockResolvedValue({
      _id: 'group-1',
      type: 'group',
      title: 'Team Chat',
      createdBy: 'user-1',
    })

    const result = await controller.createConversation(
      { user: { id: 'user-1' } } as never,
      { type: 'group', participantIds: ['user-2', 'user-3'], title: 'Team Chat' },
    )

    expect(chatService.createConversation).toHaveBeenCalledWith(
      'group',
      'user-1',
      ['user-2', 'user-3'],
      'Team Chat',
    )
    expect(result).toMatchObject({ success: true, data: { type: 'group', title: 'Team Chat' } })
  })

  it('adds a member to group and creates membership event', async () => {
    const controller = new ChatController(chatService as unknown as ChatService)

    chatService.getActiveParticipant.mockResolvedValue({ userId: 'user-1', status: 'active' })
    chatService.addMember.mockResolvedValue({ alreadyMember: false })

    const result = await controller.addMember(
      { user: { id: 'user-1' } } as never,
      'group-1',
      { userId: 'user-4' },
    )

    expect(chatService.addMember).toHaveBeenCalledWith('group-1', 'user-4', 'user-1')
    expect(result).toMatchObject({ success: true, data: { alreadyMember: false } })
  })

  it('returns already member status when adding existing member', async () => {
    const controller = new ChatController(chatService as unknown as ChatService)

    chatService.getActiveParticipant.mockResolvedValue({ userId: 'user-1', status: 'active' })
    chatService.addMember.mockResolvedValue({ alreadyMember: true })

    const result = await controller.addMember(
      { user: { id: 'user-1' } } as never,
      'group-1',
      { userId: 'user-2' },
    )

    expect(result).toMatchObject({ success: true, data: { alreadyMember: true } })
  })

  it('retrieves membership events timeline', async () => {
    const controller = new ChatController(chatService as unknown as ChatService)

    chatService.getActiveParticipant.mockResolvedValue({ userId: 'user-1', status: 'active' })
    chatService.getMembershipEvents.mockResolvedValue([
      {
        _id: 'event-1',
        type: 'joined',
        targetUserId: 'user-1',
        occurredAt: new Date().toISOString(),
      },
      {
        _id: 'event-2',
        type: 'added',
        targetUserId: 'user-2',
        actorUserId: 'user-1',
        occurredAt: new Date().toISOString(),
      },
      {
        _id: 'event-3',
        type: 'added',
        targetUserId: 'user-3',
        actorUserId: 'user-1',
        occurredAt: new Date().toISOString(),
      },
    ])

    const response = await controller.getMembershipEvents(
      { user: { id: 'user-1' } } as never,
      'group-1',
    )

    expect(chatService.getMembershipEvents).toHaveBeenCalledWith('group-1')
    expect(response.success).toBe(true)
    if (response.success) {
      expect(response.data).toHaveLength(3)
      expect(response.data[1]).toMatchObject({
        type: 'added',
        targetUserId: 'user-2',
        actorUserId: 'user-1',
      })
    }
  })
})
