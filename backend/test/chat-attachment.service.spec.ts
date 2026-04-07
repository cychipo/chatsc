jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://example.com/signed-url'),
}))

import { ChatAttachmentService } from '../src/modules/chat/chat-attachment.service'

describe('ChatAttachmentService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers()
  })

  it('creates pending attachment metadata and returns upload url with 15 minute expiry', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-04-08T10:00:00.000Z'))

    const service = Object.create(ChatAttachmentService.prototype) as ChatAttachmentService
    const create = jest.fn().mockResolvedValue(undefined)

    Object.assign(service as object, {
      attachmentModel: { create },
      conversationModel: {
        findById: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439011' }) }),
      },
      participantModel: {},
      messageModel: {},
      chatService: {
        getRequiredActiveParticipant: jest.fn().mockResolvedValue({ _id: 'participant-1' }),
      },
    })

    const internalService = service as unknown as {
      getBucketName: () => string
      getS3Client: () => unknown
      buildR2Key: () => string
      buildContentDisposition: (fileName: string) => string
    }

    jest.spyOn(internalService, 'getBucketName').mockReturnValue('chat-files')
    jest.spyOn(internalService, 'getS3Client').mockReturnValue({})
    jest.spyOn(internalService, 'buildR2Key').mockReturnValue('attachments/conv/att/report.pdf')

    const result = await service.generatePresignedUploadUrl('507f1f77bcf86cd799439012', {
      conversationId: '507f1f77bcf86cd799439011',
      fileName: 'report.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 2048,
    })

    expect(create).toHaveBeenCalled()
    expect(result).toMatchObject({
      r2Key: 'attachments/conv/att/report.pdf',
      presignedUrl: 'https://example.com/signed-url',
      expiresAt: '2026-04-08T10:15:00.000Z',
    })
  })

  it('marks uploaded attachment and keeps ownership metadata', async () => {
    const service = Object.create(ChatAttachmentService.prototype) as ChatAttachmentService
    const save = jest.fn().mockResolvedValue(undefined)

    const attachmentDocument: {
      _id: { toString(): string }
      conversationId: { toString(): string }
      uploaderId: { toString(): string }
      originalName: string
      mimeType: string
      sizeBytes: number
      isImage: boolean
      status: string
      uploadedAt?: Date
      save: jest.Mock
    } = {
      _id: { toString: () => '507f1f77bcf86cd799439013' },
      conversationId: { toString: () => '507f1f77bcf86cd799439011' },
      uploaderId: { toString: () => '507f1f77bcf86cd799439012' },
      originalName: 'photo.png',
      mimeType: 'image/png',
      sizeBytes: 1024,
      isImage: true,
      status: 'draft',
      save,
    }

    Object.assign(service as object, {
      attachmentModel: {
        findById: jest.fn().mockResolvedValue(attachmentDocument),
      },
      chatService: {
        getRequiredActiveParticipant: jest.fn().mockResolvedValue({ _id: 'participant-1' }),
      },
    })

    const result = await service.markAttachmentUploaded(
      '507f1f77bcf86cd799439011',
      '507f1f77bcf86cd799439013',
      '507f1f77bcf86cd799439012',
    )

    expect(attachmentDocument.status).toBe('uploaded')
    expect(attachmentDocument.uploadedAt).toBeInstanceOf(Date)
    expect(save).toHaveBeenCalled()
    expect(result).toMatchObject({
      attachmentId: '507f1f77bcf86cd799439013',
      uploaderId: '507f1f77bcf86cd799439012',
    })
  })

  it('returns download url for confirmed attachment after participant validation', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-04-08T10:00:00.000Z'))

    const service = Object.create(ChatAttachmentService.prototype) as ChatAttachmentService
    const getRequiredActiveParticipant = jest.fn().mockResolvedValue({ _id: 'participant-1' })

    Object.assign(service as object, {
      attachmentModel: {
        findById: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            conversationId: { toString: () => '507f1f77bcf86cd799439011' },
            r2Key: 'attachments/conv/att/photo.png',
            originalName: 'photo.png',
            mimeType: 'image/png',
            sizeBytes: 1024,
            status: 'attached',
          }),
        }),
      },
      chatService: {
        getRequiredActiveParticipant,
      },
    })

    const internalService = service as unknown as {
      getBucketName: () => string
      getS3Client: () => unknown
      buildContentDisposition: (fileName: string) => string
    }

    jest.spyOn(internalService, 'getBucketName').mockReturnValue('chat-files')
    jest.spyOn(internalService, 'getS3Client').mockReturnValue({})
    jest.spyOn(internalService, 'buildContentDisposition').mockReturnValue('attachment; filename="photo.png"')

    const result = await service.generatePresignedDownloadUrl(
      '507f1f77bcf86cd799439013',
      '507f1f77bcf86cd799439012',
    )

    expect(getRequiredActiveParticipant).toHaveBeenCalledWith('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012')
    expect(result).toMatchObject({
      presignedUrl: 'https://example.com/signed-url',
      expiresAt: '2026-04-08T10:15:00.000Z',
      fileName: 'photo.png',
    })
  })

  it('returns attachment list with uploaderId and messageId', async () => {
    const service = Object.create(ChatAttachmentService.prototype) as ChatAttachmentService

    Object.assign(service as object, {
      attachmentModel: {
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([
                {
                  _id: { toString: () => 'att-1' },
                  conversationId: { toString: () => '507f1f77bcf86cd799439011' },
                  uploaderId: { toString: () => '507f1f77bcf86cd799439012' },
                  messageId: { toString: () => '507f1f77bcf86cd799439013' },
                  originalName: 'photo.png',
                  mimeType: 'image/png',
                  sizeBytes: 1024,
                  isImage: true,
                  createdAt: new Date('2026-04-08T10:00:00.000Z'),
                },
              ]),
            }),
          }),
        }),
      },
      chatService: {
        getRequiredActiveParticipant: jest.fn().mockResolvedValue({ _id: 'participant-1' }),
      },
    })

    const result = await service.listConversationAttachments(
      '507f1f77bcf86cd799439011',
      '507f1f77bcf86cd799439012',
    )

    expect(result.attachments[0]).toMatchObject({
      attachmentId: 'att-1',
      uploaderId: '507f1f77bcf86cd799439012',
      messageId: '507f1f77bcf86cd799439013',
      fileName: 'photo.png',
    })
  })
})
