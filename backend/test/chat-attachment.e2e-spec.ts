import { ChatAttachmentService } from '../src/modules/chat/chat-attachment.service'
import { ChatController } from '../src/modules/chat/chat.controller'
import { ChatGateway } from '../src/modules/chat/chat.gateway'
import { ChatService } from '../src/modules/chat/chat.service'

describe('Chat attachment controller', () => {
  const chatService = {
    getActiveParticipant: jest.fn(),
    getParticipantRole: jest.fn(),
    getMessages: jest.fn(),
    searchMessages: jest.fn(),
    listConversationsForUser: jest.fn(),
    createConversation: jest.fn(),
    addMember: jest.fn(),
    removeMember: jest.fn(),
    leaveConversation: jest.fn(),
    deleteConversationForUser: jest.fn(),
    markConversationRead: jest.fn(),
    getMembershipEvents: jest.fn(),
  }

  const chatAttachmentService = {
    generatePresignedUploadUrl: jest.fn(),
    markAttachmentUploaded: jest.fn(),
    getAttachmentStatus: jest.fn(),
    generatePresignedDownloadUrl: jest.fn(),
    listConversationAttachments: jest.fn(),
  }

  const chatGateway = {
    emitConversationPreviews: jest.fn().mockResolvedValue(undefined),
    emitRealtimeMessage: jest.fn().mockResolvedValue(undefined),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns a presigned upload url', async () => {
    const controller = new ChatController(
      chatService as unknown as ChatService,
      chatAttachmentService as unknown as ChatAttachmentService,
      chatGateway as unknown as ChatGateway,
    )

    chatAttachmentService.generatePresignedUploadUrl.mockResolvedValue({
      attachmentId: 'att-1',
      r2Key: 'attachments/conv/att/file.png',
      presignedUrl: 'https://example.com/upload',
      expiresAt: '2026-04-08T10:15:00.000Z',
    })

    const response = await controller.generatePresignedUploadUrl(
      { user: { id: 'user-1' } } as never,
      {
        conversationId: '507f1f77bcf86cd799439011',
        fileName: 'file.png',
        mimeType: 'image/png',
        sizeBytes: 1024,
      },
    )

    expect(response).toMatchObject({
      success: true,
      data: { attachmentId: 'att-1' },
    })
  })

  it('marks attachment uploaded', async () => {
    const controller = new ChatController(
      chatService as unknown as ChatService,
      chatAttachmentService as unknown as ChatAttachmentService,
      chatGateway as unknown as ChatGateway,
    )

    chatAttachmentService.markAttachmentUploaded.mockResolvedValue({
      attachmentId: 'att-1',
      conversationId: '507f1f77bcf86cd799439011',
      uploaderId: 'user-1',
      fileName: 'file.png',
      mimeType: 'image/png',
      sizeBytes: 1024,
      isImage: true,
    })

    const response = await controller.markAttachmentUploaded(
      { user: { id: 'user-1' } } as never,
      '507f1f77bcf86cd799439011',
      { attachmentId: 'att-1' },
    )

    expect(chatAttachmentService.markAttachmentUploaded).toHaveBeenCalled()
    expect(response.success).toBe(true)
  })
})
