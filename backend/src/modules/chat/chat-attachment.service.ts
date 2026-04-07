import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Model, Types } from 'mongoose'
import { backendEnv } from '../../config/env.config'
import { ChatService } from './chat.service'
import { ChatAttachment, ChatAttachmentDocument } from './schemas/chat-attachment.schema'
import { Conversation, ConversationDocument } from './schemas/conversation.schema'
import {
  ConversationParticipant,
  ConversationParticipantDocument,
} from './schemas/conversation-participant.schema'
import { Message, MessageDocument } from './schemas/message.schema'

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024
const PRESIGNED_URL_TTL_SECONDS = 15 * 60
const IMAGE_MIME_PREFIX = 'image/'

type AttachmentPayload = {
  attachmentId: string
  fileName: string
  mimeType: string
  sizeBytes: number
  isImage: boolean
  uploaderId?: string
  conversationId?: string
  messageId?: string
}

@Injectable()
export class ChatAttachmentService {
  constructor(
    @InjectModel(ChatAttachment.name)
    private readonly attachmentModel: Model<ChatAttachmentDocument>,
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(ConversationParticipant.name)
    private readonly participantModel: Model<ConversationParticipantDocument>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    private readonly chatService: ChatService,
  ) {}

  async generatePresignedUploadUrl(userId: string, input: {
    conversationId: string
    fileName: string
    mimeType: string
    sizeBytes: number
  }) {
    const conversationId = this.requireObjectId(input.conversationId, 'INVALID_CONVERSATION_ID', 'Conversation ID is invalid')
    const fileName = input.fileName.trim()
    const mimeType = input.mimeType.trim()

    if (!fileName) {
      throw new BadRequestException({ error: 'INVALID_FILE_NAME', message: 'File name is required' })
    }

    if (!mimeType) {
      throw new BadRequestException({ error: 'INVALID_MIME_TYPE', message: 'MIME type is required' })
    }

    if (!Number.isFinite(input.sizeBytes) || input.sizeBytes <= 0 || input.sizeBytes > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException({
        error: 'INVALID_FILE_SIZE',
        message: 'File size must be greater than 0 and no larger than 25MB',
      })
    }

    const conversation = await this.conversationModel.findById(conversationId).lean()
    if (!conversation) {
      throw new NotFoundException({ error: 'CONVERSATION_NOT_FOUND', message: 'Conversation not found' })
    }

    await this.chatService.getRequiredActiveParticipant(conversationId.toString(), userId)

    const attachmentId = new Types.ObjectId()
    const r2Key = this.buildR2Key(conversationId.toString(), attachmentId.toString(), fileName)
    const isImage = mimeType.startsWith(IMAGE_MIME_PREFIX)

    await this.attachmentModel.create({
      _id: attachmentId,
      conversationId,
      uploaderId: new Types.ObjectId(userId),
      r2Key,
      originalName: fileName,
      mimeType,
      sizeBytes: input.sizeBytes,
      isImage,
      status: 'draft',
      createdAt: new Date(),
    })

    const command = new PutObjectCommand({
      Bucket: this.getBucketName(),
      Key: r2Key,
      ContentType: mimeType,
    })
    const presignedUrl = await getSignedUrl(this.getS3Client(), command, { expiresIn: PRESIGNED_URL_TTL_SECONDS })
    const expiresAt = new Date(Date.now() + PRESIGNED_URL_TTL_SECONDS * 1000).toISOString()

    return {
      attachmentId: attachmentId.toString(),
      r2Key,
      presignedUrl,
      expiresAt,
    }
  }

  async markAttachmentUploaded(conversationIdValue: string, attachmentIdValue: string, userId: string) {
    const conversationId = this.requireObjectId(conversationIdValue, 'INVALID_CONVERSATION_ID', 'Conversation ID is invalid')
    const attachmentId = this.requireObjectId(attachmentIdValue, 'INVALID_ATTACHMENT_ID', 'Attachment ID is invalid')

    await this.chatService.getRequiredActiveParticipant(conversationId.toString(), userId)

    const attachment = await this.attachmentModel.findById(attachmentId)
    if (!attachment) {
      throw new NotFoundException({ error: 'ATTACHMENT_NOT_FOUND', message: 'Attachment not found' })
    }

    if (attachment.conversationId.toString() !== conversationId.toString()) {
      throw new NotFoundException({ error: 'ATTACHMENT_NOT_FOUND', message: 'Attachment not found' })
    }

    if (attachment.uploaderId.toString() !== userId) {
      throw new ForbiddenException('Attachment does not belong to this user')
    }

    if (attachment.status === 'attached') {
      throw new BadRequestException({ error: 'ATTACHMENT_ALREADY_ATTACHED', message: 'Attachment was already attached' })
    }

    attachment.status = 'uploaded'
    attachment.uploadedAt = new Date()
    await attachment.save()

    return this.toAttachmentPayload(attachment)
  }

  async getAttachmentStatus(attachmentIdValue: string, userId: string) {
    const attachmentId = this.requireObjectId(attachmentIdValue, 'INVALID_ATTACHMENT_ID', 'Attachment ID is invalid')
    const attachment = await this.attachmentModel.findById(attachmentId).lean()

    if (!attachment) {
      throw new NotFoundException({ error: 'ATTACHMENT_NOT_FOUND', message: 'Attachment not found' })
    }

    await this.chatService.getRequiredActiveParticipant(attachment.conversationId.toString(), userId)

    return {
      attachmentId: attachment._id.toString(),
      status: attachment.status,
      messageId: attachment.messageId?.toString(),
      uploadedAt: attachment.uploadedAt?.toISOString(),
      confirmedAt: attachment.confirmedAt?.toISOString(),
    }
  }

  async generatePresignedDownloadUrl(attachmentIdValue: string, userId: string) {
    const attachmentId = this.requireObjectId(attachmentIdValue, 'INVALID_ATTACHMENT_ID', 'Attachment ID is invalid')
    const attachment = await this.attachmentModel.findById(attachmentId).lean()

    if (!attachment || attachment.status !== 'attached') {
      throw new NotFoundException({ error: 'ATTACHMENT_NOT_FOUND', message: 'Attachment not found' })
    }

    await this.chatService.getRequiredActiveParticipant(attachment.conversationId.toString(), userId)

    const command = new GetObjectCommand({
      Bucket: this.getBucketName(),
      Key: attachment.r2Key,
      ResponseContentType: attachment.mimeType,
      ResponseContentDisposition: this.buildContentDisposition(attachment.originalName),
    })
    const presignedUrl = await getSignedUrl(this.getS3Client(), command, { expiresIn: PRESIGNED_URL_TTL_SECONDS })
    const expiresAt = new Date(Date.now() + PRESIGNED_URL_TTL_SECONDS * 1000).toISOString()

    return {
      presignedUrl,
      expiresAt,
      fileName: attachment.originalName,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
    }
  }

  async listConversationAttachments(conversationIdValue: string, userId: string, before?: string, limit = 20) {
    const conversationId = this.requireObjectId(conversationIdValue, 'INVALID_CONVERSATION_ID', 'Conversation ID is invalid')
    await this.chatService.getRequiredActiveParticipant(conversationId.toString(), userId)

    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50)
    const query: Record<string, unknown> = {
      conversationId,
      status: 'attached',
    }

    if (before) {
      query.createdAt = { $lt: new Date(before) }
    }

    const attachments = await this.attachmentModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(safeLimit + 1)
      .lean()

    const hasMore = attachments.length > safeLimit
    const items = attachments.slice(0, safeLimit).map((attachment) => ({
      attachmentId: attachment._id.toString(),
      conversationId: attachment.conversationId.toString(),
      uploaderId: attachment.uploaderId.toString(),
      messageId: attachment.messageId?.toString(),
      fileName: attachment.originalName,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
      isImage: attachment.isImage,
      createdAt: attachment.createdAt.toISOString(),
    }))

    return {
      attachments: items,
      hasMore,
    }
  }

  toAttachmentPayload(input: {
    _id: Types.ObjectId | { toString(): string }
    originalName: string
    mimeType: string
    sizeBytes: number
    isImage: boolean
    uploaderId?: Types.ObjectId | { toString(): string }
    conversationId?: Types.ObjectId | { toString(): string }
    messageId?: Types.ObjectId | { toString(): string }
  }): AttachmentPayload {
    return {
      attachmentId: input._id.toString(),
      fileName: input.originalName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      isImage: input.isImage,
      uploaderId: input.uploaderId?.toString(),
      conversationId: input.conversationId?.toString(),
      messageId: input.messageId?.toString(),
    }
  }

  private getS3Client() {
    const env = backendEnv()

    if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET_NAME) {
      throw new BadRequestException({
        error: 'R2_CONFIG_MISSING',
        message: 'R2 configuration is incomplete',
      })
    }

    return new S3Client({
      region: 'auto',
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    })
  }

  private getBucketName() {
    const env = backendEnv()

    if (!env.R2_BUCKET_NAME) {
      throw new BadRequestException({ error: 'R2_BUCKET_MISSING', message: 'R2 bucket name is missing' })
    }

    return env.R2_BUCKET_NAME
  }

  private requireObjectId(value: string, code: string, message: string) {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException({ error: code, message })
    }

    return new Types.ObjectId(value)
  }

  private buildR2Key(conversationId: string, attachmentId: string, fileName: string) {
    const sanitizedName = fileName
      .normalize('NFKD')
      .replace(/[^a-zA-Z0-9._-]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 128) || 'file'

    return `attachments/${conversationId}/${attachmentId}/${sanitizedName}`
  }

  private buildContentDisposition(fileName: string) {
    const safeName = fileName.replace(/"/g, '')
    return `attachment; filename="${safeName}"`
  }

  private async incrementUnreadForOtherParticipants(conversationId: string, senderId: string) {
    await this.participantModel.updateMany(
      {
        conversationId: new Types.ObjectId(conversationId),
        userId: { $ne: new Types.ObjectId(senderId) },
        status: 'active',
      },
      {
        $inc: { unreadCount: 1 },
      },
    )
  }

  private async restoreDirectParticipantsIfNeeded(conversationId: string, senderId: string) {
    const conversation = await this.conversationModel.findById(conversationId).lean()

    if (!conversation || conversation.type !== 'direct') {
      return [] as ConversationParticipantDocument[]
    }

    const participants = await this.participantModel.find({ conversationId: new Types.ObjectId(conversationId) }).sort({ joinedAt: 1 })
    const participantsToRestore = participants.filter((participant) => participant.userId.toString() !== senderId && participant.status === 'left')

    if (participantsToRestore.length === 0) {
      return [] as ConversationParticipantDocument[]
    }

    await Promise.all(
      participantsToRestore.map((participant) => this.participantModel.updateOne(
        { _id: participant._id },
        { status: 'active', leftAt: undefined },
      )),
    )

    return this.participantModel.find({ _id: { $in: participantsToRestore.map((participant) => participant._id) } })
  }
}
