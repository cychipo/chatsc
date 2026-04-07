import { ChatService } from '../src/modules/chat/chat.service'

describe('Chat message search', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('matches against decrypted message content when storage is encrypted', async () => {
    const service = Object.create(ChatService.prototype) as ChatService

    const lean = jest.fn().mockResolvedValue([
      {
        _id: { toString: () => 'msg-1' },
        conversationId: { toString: () => '507f1f77bcf86cd799439011' },
        senderId: { toString: () => 'user-1' },
        content: 'enc-1',
        reverseEncryptionState: 'encrypted',
        sentAt: new Date('2026-04-07T10:00:00.000Z'),
      },
      {
        _id: { toString: () => 'msg-2' },
        conversationId: { toString: () => '507f1f77bcf86cd799439011' },
        senderId: { toString: () => 'user-2' },
        content: 'enc-2',
        reverseEncryptionState: 'encrypted',
        sentAt: new Date('2026-04-07T09:00:00.000Z'),
      },
    ])
    const limit = jest.fn().mockReturnValue({ lean })
    const sort = jest.fn().mockReturnValue({ limit })

    const messageModel = {
      find: jest.fn().mockReturnValue({ sort }),
    }
    const toDisplayMessage = jest
      .fn()
      .mockResolvedValueOnce({
        _id: { toString: () => 'msg-1' },
        conversationId: { toString: () => '507f1f77bcf86cd799439011' },
        senderId: { toString: () => 'user-1' },
        senderDisplayName: 'Alice',
        senderAvatarUrl: 'https://example.com/a.png',
        content: 'hello world',
        sentAt: '2026-04-07T10:00:00.000Z',
      })
      .mockResolvedValueOnce({
        _id: { toString: () => 'msg-2' },
        conversationId: { toString: () => '507f1f77bcf86cd799439011' },
        senderId: { toString: () => 'user-2' },
        senderDisplayName: 'Bob',
        content: 'goodbye',
        sentAt: '2026-04-07T09:00:00.000Z',
      })

    Object.assign(service as object, {
      messageModel,
      toDisplayMessage,
    })

    const results = await service.searchMessages('507f1f77bcf86cd799439011', 'hello')

    expect(messageModel.find).toHaveBeenCalledWith({
      conversationId: expect.anything(),
    })
    expect(sort).toHaveBeenCalledWith({ sentAt: -1 })
    expect(limit).toHaveBeenCalledWith(100)
    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      messageId: 'msg-1',
      conversationId: '507f1f77bcf86cd799439011',
      content: 'hello world',
      encryptedContent: 'enc-1',
      senderDisplayName: 'Alice',
    })
  })
})
