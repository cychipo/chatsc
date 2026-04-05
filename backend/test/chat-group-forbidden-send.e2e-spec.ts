import { ForbiddenException } from '@nestjs/common'
import { ChatService } from '../src/modules/chat/chat.service'

describe('Chat realtime permission checks', () => {
  const chatService = {
    getRequiredActiveParticipant: jest.fn(),
    sendMessage: jest.fn(),
    toRealtimeMessagePayload: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('rejects message from user who left the group', async () => {
    const service = Object.create(ChatService.prototype) as ChatService
    Object.assign(service, chatService)

    chatService.getRequiredActiveParticipant.mockRejectedValue(new ForbiddenException())

    await expect(service.sendRealtimeMessage('group-1', 'left-user', 'Hello')).rejects.toBeInstanceOf(ForbiddenException)
    expect(chatService.sendMessage).not.toHaveBeenCalled()
  })

  it('allows message from active participant', async () => {
    const service = Object.create(ChatService.prototype) as ChatService
    Object.assign(service, chatService)

    chatService.getRequiredActiveParticipant.mockResolvedValue({ userId: 'active-user', status: 'active' })
    chatService.sendMessage.mockResolvedValue({
      _id: { toString: () => 'msg-1' },
      conversationId: { toString: () => 'group-1' },
      senderId: { toString: () => 'active-user' },
      content: 'Active message',
      sentAt: new Date('2026-04-05T10:00:00.000Z'),
    })
    chatService.toRealtimeMessagePayload.mockReturnValue({
      messageId: 'msg-1',
      conversationId: 'group-1',
      senderId: 'active-user',
      content: 'Active message',
      sentAt: '2026-04-05T10:00:00.000Z',
    })

    const result = await service.sendRealtimeMessage('group-1', 'active-user', 'Active message')

    expect(chatService.sendMessage).toHaveBeenCalledWith('group-1', 'active-user', 'Active message')
    expect(result).toMatchObject({ content: 'Active message' })
  })
})
