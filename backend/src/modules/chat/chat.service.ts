import { BadRequestException, ForbiddenException, Injectable, ServiceUnavailableException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { AuthService } from '../auth/auth.service'
import { SessionUser } from '../auth/types/auth-session'
import { ChatEncryptionService } from './chat-encryption.service'
import { Conversation, ConversationDocument } from './schemas/conversation.schema'
import { ConversationParticipant, ConversationParticipantDocument } from './schemas/conversation-participant.schema'
import { Message, MessageDocument, ReverseEncryptionState, SeenState } from './schemas/message.schema'
import { MembershipEvent, MembershipEventDocument } from './schemas/membership-event.schema'
import { ChatAttachment, ChatAttachmentDocument } from './schemas/chat-attachment.schema'

type ConversationSummary = {
  _id: string
  type: 'direct' | 'group'
  title?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  lastMessageAt?: string
  displayTitle: string
  displayAvatarUrl?: string
  lastMessagePreview?: string
  unreadCount: number
  hasUnread: boolean
  directPeer?: SessionUser
}

export type MessageDisplayState = 'ready' | 'decode_failed'

export type ChatAttachmentPayload = {
  attachmentId: string
  fileName: string
  mimeType: string
  sizeBytes: number
  isImage: boolean
  uploaderId?: string
  conversationId?: string
  messageId?: string
}

export type RealtimeMessagePayload = {
  messageId: string
  conversationId: string
  senderId: string
  senderDisplayName?: string
  senderAvatarUrl?: string
  content: string
  sentAt: string
  seenState?: SeenState
  attachment?: ChatAttachmentPayload
  isTailOfSenderGroup?: boolean
  decodeErrorCode?: string
  displayState?: MessageDisplayState
}

export type ConversationPreviewPayload = {
  conversationId: string
  lastMessagePreview: string
  lastMessageAt: string
  unreadCount: number
  hasUnread: boolean
}

export type MarkConversationReadPayload = {
  conversationId: string
  unreadCount: number
  lastReadMessageId?: string
}

export type ChatMessagePayload = {
  _id: Types.ObjectId | { toString(): string }
  conversationId: Types.ObjectId | { toString(): string }
  senderId: Types.ObjectId | { toString(): string }
  senderDisplayName?: string
  senderAvatarUrl?: string
  content: string
  encryptedContent?: string
  sentAt: Date | string
  deliveryStatus?: 'sent' | 'failed'
  seenState?: SeenState
  attachment?: ChatAttachmentPayload
  isTailOfSenderGroup?: boolean
  decodeErrorCode?: string
  displayState?: MessageDisplayState
  reverseEncryptionState?: ReverseEncryptionState
}

export type MessageSearchPayload = {
  messageId: string
  conversationId: string
  senderId: string
  senderDisplayName?: string
  senderAvatarUrl?: string
  content: string
  encryptedContent?: string
  sentAt: string
  decodeErrorCode?: string
  displayState?: MessageDisplayState
}

export type RealtimeErrorPayload = {
  code: string
  message: string
  conversationId?: string
}

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
    @InjectModel(ConversationParticipant.name)
    private participantModel: Model<ConversationParticipantDocument>,
    @InjectModel(Message.name)
    private messageModel: Model<MessageDocument>,
    @InjectModel(MembershipEvent.name)
    private membershipEventModel: Model<MembershipEventDocument>,
    @InjectModel(ChatAttachment.name)
    private attachmentModel: Model<ChatAttachmentDocument>,
    private authService: AuthService,
    private chatEncryptionService: ChatEncryptionService,
  ) {}

  async listConversationsForUser(userId: string): Promise<ConversationSummary[]> {
    const participations = await this.participantModel
      .find({ userId: new Types.ObjectId(userId), status: 'active' })
      .lean()
    const participationByConversationId = new Map(
      participations.map((participant) => [participant.conversationId.toString(), participant]),
    )
    const conversationIds = participations.map((p) => p.conversationId)
    const conversations = await this.conversationModel
      .find({ _id: { $in: conversationIds } })
      .sort({ lastMessageAt: -1 })
      .lean()

    return Promise.all(
      conversations.map(async (conversation) => {
        const latestMessage = await this.messageModel
          .findOne({ conversationId: conversation._id })
          .sort({ sentAt: -1 })
          .lean()
        const conversationWithTimestamps = conversation as typeof conversation & {
          createdAt?: Date
          updatedAt?: Date
        }
        const participant = participationByConversationId.get(conversation._id.toString())
        const unreadCount = participant?.unreadCount ?? 0
        const hasUnread = unreadCount > 0

        if (conversation.type === 'direct') {
          const participants = await this.participantModel
            .find({ conversationId: conversation._id, status: 'active' })
            .lean()
          const peerParticipant = participants.find((participantItem) => participantItem.userId.toString() !== userId)
          const directPeer = peerParticipant
            ? await this.authService.findById(peerParticipant.userId.toString())
            : null
          const displayTitle = directPeer?.displayName ?? conversation.title ?? 'Đoạn chat mới'

          const latestDisplayMessage = latestMessage ? await this.toDisplayMessage(latestMessage) : null

          return {
            _id: conversation._id.toString(),
            type: conversation.type,
            title: conversation.title,
            createdBy: conversation.createdBy.toString(),
            createdAt: conversationWithTimestamps.createdAt?.toISOString() ?? new Date().toISOString(),
            updatedAt: conversationWithTimestamps.updatedAt?.toISOString() ?? new Date().toISOString(),
            lastMessageAt:
              latestMessage?.sentAt?.toISOString() ??
              conversation.lastMessageAt?.toISOString(),
            displayTitle,
            displayAvatarUrl: directPeer?.avatarUrl,
            lastMessagePreview: latestDisplayMessage ? this.buildMessagePreview(latestDisplayMessage) : undefined,
            unreadCount,
            hasUnread,
            directPeer: directPeer ?? undefined,
          }
        }

        const latestDisplayMessage = latestMessage ? await this.toDisplayMessage(latestMessage) : null

        return {
          _id: conversation._id.toString(),
          type: conversation.type,
          title: conversation.title,
          createdBy: conversation.createdBy.toString(),
          createdAt: conversationWithTimestamps.createdAt?.toISOString() ?? new Date().toISOString(),
          updatedAt: conversationWithTimestamps.updatedAt?.toISOString() ?? new Date().toISOString(),
          lastMessageAt:
            latestMessage?.sentAt?.toISOString() ??
            conversation.lastMessageAt?.toISOString(),
          displayTitle: conversation.title ?? 'Nhóm chat',
          lastMessagePreview: latestDisplayMessage ? this.buildMessagePreview(latestDisplayMessage) : undefined,
          unreadCount,
          hasUnread,
        }
      }),
    )
  }

  async createConversation(
    type: 'direct' | 'group',
    creatorId: string,
    participantIds: string[],
    title?: string,
  ) {
    if (type === 'direct') {
      const targetUserId = participantIds[0]

      if (targetUserId === creatorId) {
        throw new BadRequestException({
          error: 'INVALID_DIRECT_CONVERSATION',
          message: 'Cannot create a direct conversation with yourself',
        })
      }

      const existingConversation = await this.findDirectConversation(creatorId, targetUserId)
      if (existingConversation) {
        return existingConversation
      }
    }

    const conversation = await this.conversationModel.create({
      type,
      title,
      createdBy: new Types.ObjectId(creatorId),
    })

    const allParticipantIds = Array.from(new Set([creatorId, ...participantIds]))

    const participantDocs = allParticipantIds.map((uid) => ({
      conversationId: conversation._id,
      userId: new Types.ObjectId(uid),
      role: uid === creatorId ? 'owner' : 'member',
      status: 'active',
      addedBy: uid === creatorId ? undefined : new Types.ObjectId(creatorId),
      joinedAt: new Date(),
    }))

    await this.participantModel.insertMany(participantDocs)

    const membershipEvents = allParticipantIds.map((uid) => ({
      conversationId: conversation._id,
      type: uid === creatorId ? 'joined' : 'added',
      targetUserId: new Types.ObjectId(uid),
      actorUserId: uid === creatorId ? undefined : new Types.ObjectId(creatorId),
      occurredAt: new Date(),
    }))

    await this.membershipEventModel.insertMany(membershipEvents)

    return conversation
  }

  async getActiveParticipant(conversationId: string, userId: string) {
    return this.participantModel.findOne({
      conversationId: new Types.ObjectId(conversationId),
      userId: new Types.ObjectId(userId),
      status: 'active',
    })
  }

  async findDirectConversation(userAId: string, userBId: string) {
    const allParticipants = await this.participantModel
      .find({
        userId: { $in: [new Types.ObjectId(userAId), new Types.ObjectId(userBId)] },
      })
      .lean()

    const conversationIdsByUser = new Map<string, Set<string>>()

    for (const participant of allParticipants) {
      const key = participant.userId.toString()
      const existingIds = conversationIdsByUser.get(key) ?? new Set<string>()
      existingIds.add(participant.conversationId.toString())
      conversationIdsByUser.set(key, existingIds)
    }

    const userAConversationIds = conversationIdsByUser.get(userAId) ?? new Set<string>()
    const userBConversationIds = conversationIdsByUser.get(userBId) ?? new Set<string>()
    const sharedConversationIds = Array.from(userAConversationIds).filter((id) => userBConversationIds.has(id))

    if (sharedConversationIds.length === 0) {
      return null
    }

    const conversations = await this.conversationModel
      .find({
        _id: { $in: sharedConversationIds.map((id) => new Types.ObjectId(id)) },
        type: 'direct',
      })
      .sort({ updatedAt: -1 })
      .lean()

    for (const conversation of conversations) {
      const participants = await this.participantModel
        .find({ conversationId: conversation._id })
        .lean()

      if (participants.length !== 2) {
        continue
      }

      const participantIds = new Set(participants.map((participant) => participant.userId.toString()))

      if (!participantIds.has(userAId) || !participantIds.has(userBId)) {
        continue
      }

      return conversation
    }

    return null
  }

  async sendMessage(conversationId: string, senderId: string, content: string, attachmentIdValue?: string) {
    const trimmedContent = content.trim()
    const activeSender = await this.getRequiredActiveParticipant(conversationId, senderId)
    const restoredParticipants = await this.restoreDirectParticipantsIfNeeded(conversationId, senderId)

    let attachmentDocument: ChatAttachmentDocument | null = null

    if (attachmentIdValue) {
      if (!Types.ObjectId.isValid(attachmentIdValue)) {
        throw new BadRequestException({
          code: 'INVALID_ATTACHMENT_ID',
          message: 'Attachment ID is invalid',
        })
      }

      attachmentDocument = await this.attachmentModel.findById(new Types.ObjectId(attachmentIdValue))

      if (!attachmentDocument || attachmentDocument.conversationId.toString() !== conversationId) {
        throw new BadRequestException({
          code: 'ATTACHMENT_NOT_FOUND',
          message: 'Attachment not found',
        })
      }

      if (attachmentDocument.uploaderId.toString() !== senderId) {
        throw new ForbiddenException('Attachment does not belong to this user')
      }

      if (attachmentDocument.status !== 'uploaded') {
        throw new BadRequestException({
          code: 'ATTACHMENT_NOT_READY',
          message: 'Attachment upload is not ready',
        })
      }
    }

    if (!trimmedContent && !attachmentDocument) {
      throw new BadRequestException({
        code: 'EMPTY_MESSAGE',
        message: 'Message content cannot be empty',
      })
    }

    const encrypted = trimmedContent
      ? await this.chatEncryptionService.encryptForStorage(trimmedContent, {
        senderId,
        conversationId,
      })
      : {
        content: '',
        reverseEncryptionState: 'legacy' as const,
        decodeErrorCode: undefined as string | undefined,
      }

    const message = await this.messageModel.create({
      conversationId: new Types.ObjectId(conversationId),
      senderId: new Types.ObjectId(senderId),
      content: encrypted.content,
      reverseEncryptionState: encrypted.reverseEncryptionState,
      encryptedContentVersion: encrypted.reverseEncryptionState === 'encrypted' ? 'reverse-v1' : undefined,
      sentAt: new Date(),
      deliveryStatus: 'sent',
      seenState: 'sent',
      decodeErrorCode: encrypted.decodeErrorCode,
      attachment: attachmentDocument
        ? {
          attachmentId: attachmentDocument._id,
          fileName: attachmentDocument.originalName,
          mimeType: attachmentDocument.mimeType,
          sizeBytes: attachmentDocument.sizeBytes,
          isImage: attachmentDocument.isImage,
        }
        : undefined,
    })

    if (attachmentDocument) {
      attachmentDocument.messageId = message._id
      attachmentDocument.status = 'attached'
      attachmentDocument.confirmedAt = new Date()
      await attachmentDocument.save()
    }

    await this.conversationModel.updateOne(
      { _id: new Types.ObjectId(conversationId) },
      { lastMessageAt: message.sentAt },
    )

    await this.participantModel.updateOne(
      { _id: activeSender._id },
      {
        lastReadMessageId: message._id,
        lastReadAt: message.sentAt,
        unreadCount: 0,
      },
    )

    await this.incrementUnreadForOtherParticipants(conversationId, senderId, message._id, message.sentAt)

    return {
      message,
      restoredParticipants,
    }
  }

  async sendRealtimeMessage(conversationId: string, senderId: string, content: string, attachmentIdValue?: string) {
    const { message, restoredParticipants } = await this.sendMessage(conversationId, senderId, content, attachmentIdValue)
    return {
      message: await this.toRealtimeMessagePayload(message),
      previewByUserId: await this.buildConversationPreviewPayloads(conversationId),
      restoredParticipants,
    }
  }

  async getMessages(conversationId: string, before?: string, limit = 10): Promise<ChatMessagePayload[]> {
    const query: Record<string, unknown> = { conversationId: new Types.ObjectId(conversationId) }
    if (before) {
      query.sentAt = { $lt: new Date(before) }
    }

    const messages = await this.messageModel.find(query).sort({ sentAt: -1 }).limit(Math.min(limit, 50)).lean()
    const sortedMessages = messages.reverse()

    return Promise.all(
      sortedMessages.map(async (message, index) => {
        const nextMessage = sortedMessages[index + 1]
        const displayMessage = await this.toDisplayMessage(message)
        const { attachment: _rawAttachment, ...messageWithoutAttachment } = displayMessage as typeof displayMessage & {
          attachment?: { attachmentId: Types.ObjectId | { toString(): string }; fileName: string; mimeType: string; sizeBytes: number; isImage: boolean }
        }

        return {
          ...messageWithoutAttachment,
          attachment: this.buildAttachmentPayload({
            attachment: _rawAttachment,
            senderId: displayMessage.senderId,
            conversationId: displayMessage.conversationId,
            messageId: displayMessage._id,
          }),
          isTailOfSenderGroup: nextMessage ? nextMessage.senderId.toString() !== message.senderId.toString() : true,
        }
      }),
    )
  }

  async buildConversationPreviewPayload(conversationId: string, userId: string): Promise<ConversationPreviewPayload> {
    const latestMessage = await this.messageModel
      .findOne({ conversationId: new Types.ObjectId(conversationId) })
      .sort({ sentAt: -1 })
      .lean()

    const conversation = await this.conversationModel.findById(conversationId).lean()
    const participant = await this.participantModel
      .findOne({ conversationId: new Types.ObjectId(conversationId), userId: new Types.ObjectId(userId), status: 'active' })
      .lean()
    const previewMessage = latestMessage ? await this.toDisplayMessage(latestMessage) : null
    const unreadCount = participant?.unreadCount ?? 0

    return {
      conversationId,
      lastMessagePreview: previewMessage ? this.buildMessagePreview(previewMessage) : '',
      lastMessageAt:
        latestMessage?.sentAt?.toISOString() ??
        conversation?.lastMessageAt?.toISOString() ??
        new Date().toISOString(),
      unreadCount,
      hasUnread: unreadCount > 0,
    }
  }

  async buildConversationPreviewPayloads(conversationId: string) {
    const participants = await this.getActiveParticipants(conversationId)

    return Promise.all(
      participants.map(async (participant) => ({
        userId: participant.userId.toString(),
        preview: await this.buildConversationPreviewPayload(conversationId, participant.userId.toString()),
      })),
    )
  }

  async searchMessages(conversationId: string, query: string): Promise<MessageSearchPayload[]> {
    const trimmedQuery = query.trim()

    if (trimmedQuery.length < 2) {
      return []
    }

    const escapedQuery = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const searchRegex = new RegExp(escapedQuery, 'i')

    const messages = await this.messageModel
      .find({ conversationId: new Types.ObjectId(conversationId) })
      .sort({ sentAt: -1 })
      .limit(100)
      .lean()

    const displayMessages = await Promise.all(
      messages.map(async (message) => {
        const displayMessage = await this.toDisplayMessage(message)

        return {
          messageId: message._id.toString(),
          conversationId: message.conversationId.toString(),
          senderId: message.senderId.toString(),
          senderDisplayName: displayMessage.senderDisplayName,
          senderAvatarUrl: displayMessage.senderAvatarUrl,
          content: displayMessage.content,
          encryptedContent: message.content,
          sentAt: message.sentAt.toISOString(),
          decodeErrorCode: displayMessage.decodeErrorCode,
          displayState: displayMessage.displayState,
        }
      }),
    )

    return displayMessages
      .filter((message) => searchRegex.test(message.content))
      .slice(0, 20)
  }

  async markConversationRead(conversationId: string, userId: string): Promise<MarkConversationReadPayload> {
    const participant = await this.getRequiredActiveParticipant(conversationId, userId)
    const latestMessage = await this.messageModel
      .findOne({ conversationId: new Types.ObjectId(conversationId) })
      .sort({ sentAt: -1 })

    if (!latestMessage) {
      await this.participantModel.updateOne(
        { _id: participant._id },
        { unreadCount: 0 },
      )

      return {
        conversationId,
        unreadCount: 0,
      }
    }

    await this.participantModel.updateOne(
      { _id: participant._id },
      {
        lastReadMessageId: latestMessage._id,
        lastReadAt: new Date(),
        unreadCount: 0,
      },
    )

    const conversationParticipants = await this.participantModel
      .find({ conversationId: new Types.ObjectId(conversationId), status: 'active' })
      .lean()
    const otherParticipantIds = conversationParticipants
      .filter((conversationParticipant) => conversationParticipant.userId.toString() !== userId)
      .map((conversationParticipant) => conversationParticipant.userId)

    if (otherParticipantIds.length > 0) {
      await this.messageModel.updateMany(
        {
          conversationId: new Types.ObjectId(conversationId),
          senderId: { $in: otherParticipantIds },
          sentAt: { $lte: latestMessage.sentAt },
        },
        {
          seenState: 'seen',
        },
      )
    }

    return {
      conversationId,
      unreadCount: 0,
      lastReadMessageId: latestMessage._id.toString(),
    }
  }

  async addMember(conversationId: string, userId: string, actorId: string) {
    const existing = await this.participantModel.findOne({
      conversationId: new Types.ObjectId(conversationId),
      userId: new Types.ObjectId(userId),
      status: 'active',
    })
    if (existing) {
      return { alreadyMember: true }
    }

    await this.participantModel.create({
      conversationId: new Types.ObjectId(conversationId),
      userId: new Types.ObjectId(userId),
      role: 'member',
      status: 'active',
      addedBy: new Types.ObjectId(actorId),
      joinedAt: new Date(),
    })

    await this.membershipEventModel.create({
      conversationId: new Types.ObjectId(conversationId),
      type: 'added',
      targetUserId: new Types.ObjectId(userId),
      actorUserId: new Types.ObjectId(actorId),
      occurredAt: new Date(),
    })

    return { alreadyMember: false }
  }

  async removeMember(conversationId: string, userId: string, actorId: string) {
    await this.participantModel.updateOne(
      {
        conversationId: new Types.ObjectId(conversationId),
        userId: new Types.ObjectId(userId),
        status: 'active',
      },
      { status: 'removed', leftAt: new Date() },
    )

    await this.membershipEventModel.create({
      conversationId: new Types.ObjectId(conversationId),
      type: 'removed',
      targetUserId: new Types.ObjectId(userId),
      actorUserId: new Types.ObjectId(actorId),
      occurredAt: new Date(),
    })
  }

  async leaveConversation(conversationId: string, userId: string) {
    await this.markConversationLeft(conversationId, userId)
  }

  async deleteConversationForUser(conversationId: string, userId: string) {
    await this.markConversationLeft(conversationId, userId)
  }

  private async markConversationLeft(conversationId: string, userId: string) {
    await this.participantModel.updateOne(
      {
        conversationId: new Types.ObjectId(conversationId),
        userId: new Types.ObjectId(userId),
        status: 'active',
      },
      { status: 'left', leftAt: new Date() },
    )

    await this.membershipEventModel.create({
      conversationId: new Types.ObjectId(conversationId),
      type: 'left',
      targetUserId: new Types.ObjectId(userId),
      occurredAt: new Date(),
    })
  }

  async getMembershipEvents(conversationId: string) {
    return this.membershipEventModel
      .find({ conversationId: new Types.ObjectId(conversationId) })
      .sort({ occurredAt: -1 })
      .lean()
  }

  async getParticipantRole(conversationId: string, userId: string) {
    const participant = await this.participantModel.findOne({
      conversationId: new Types.ObjectId(conversationId),
      userId: new Types.ObjectId(userId),
      status: 'active',
    })
    return participant?.role
  }

  async getActiveParticipants(conversationId: string) {
    return this.participantModel
      .find({ conversationId: new Types.ObjectId(conversationId), status: 'active' })
      .lean()
  }

  async getRequiredActiveParticipant(conversationId: string, userId: string) {
    const participant = await this.getActiveParticipant(conversationId, userId)

    if (!participant) {
      throw new ForbiddenException('You are not an active participant of this conversation')
    }

    return participant
  }

  async toRealtimeMessagePayload(message: {
    _id: Types.ObjectId | { toString(): string }
    conversationId: Types.ObjectId | { toString(): string }
    senderId: Types.ObjectId | { toString(): string }
    content: string
    sentAt: Date
    seenState?: SeenState
    reverseEncryptionState?: ReverseEncryptionState
    decodeErrorCode?: string
  }): Promise<RealtimeMessagePayload> {
    try {
      const display = await this.chatEncryptionService.decryptForDisplay(
        message.content,
        message.reverseEncryptionState,
        {
          senderId: message.senderId.toString(),
          conversationId: message.conversationId.toString(),
        },
      )

      const senderPresentation = await this.buildSenderPresentation(message.senderId)

      return {
        messageId: message._id.toString(),
        conversationId: message.conversationId.toString(),
        senderId: message.senderId.toString(),
        ...senderPresentation,
        content: display.content,
        sentAt: message.sentAt.toISOString(),
        seenState: message.seenState,
        attachment: this.buildAttachmentPayload({
          attachment: (message as { attachment?: { attachmentId: Types.ObjectId | { toString(): string }; fileName: string; mimeType: string; sizeBytes: number; isImage: boolean } }).attachment,
          senderId: message.senderId,
          conversationId: message.conversationId,
          messageId: message._id,
        }),
        isTailOfSenderGroup: true,
        decodeErrorCode: display.decodeErrorCode,
        displayState: display.displayState,
      }
    } catch (error) {
      const failureCode = error instanceof Error && 'code' in error && typeof error.code === 'string'
        ? error.code
        : 'REVERSE_DECRYPTION_UNAVAILABLE'

      const senderPresentation = await this.buildSenderPresentation(message.senderId)

      return {
        messageId: message._id.toString(),
        conversationId: message.conversationId.toString(),
        senderId: message.senderId.toString(),
        ...senderPresentation,
        content: message.content,
        sentAt: message.sentAt.toISOString(),
        seenState: message.seenState,
        attachment: this.buildAttachmentPayload({
          attachment: (message as { attachment?: { attachmentId: Types.ObjectId | { toString(): string }; fileName: string; mimeType: string; sizeBytes: number; isImage: boolean } }).attachment,
          senderId: message.senderId,
          conversationId: message.conversationId,
          messageId: message._id,
        }),
        isTailOfSenderGroup: true,
        decodeErrorCode: failureCode,
        displayState: 'decode_failed' as const,
      }
    }
  }

  private async restoreDirectParticipantsIfNeeded(conversationId: string, senderId: string) {
    const conversation = await this.conversationModel.findById(conversationId).lean()

    if (!conversation || conversation.type !== 'direct') {
      return [] as ConversationParticipantDocument[]
    }

    const participants = await this.participantModel
      .find({ conversationId: new Types.ObjectId(conversationId) })
      .sort({ joinedAt: 1 })

    const participantsToRestore = participants.filter((participant) => (
      participant.userId.toString() !== senderId
      && participant.status === 'left'
    ))

    if (participantsToRestore.length === 0) {
      return [] as ConversationParticipantDocument[]
    }

    await Promise.all(
      participantsToRestore.map((participant) => this.participantModel.updateOne(
        { _id: participant._id },
        {
          status: 'active',
          leftAt: undefined,
        },
      )),
    )

    return this.participantModel.find({
      _id: { $in: participantsToRestore.map((participant) => participant._id) },
    })
  }

  private async incrementUnreadForOtherParticipants(
    conversationId: string,
    senderId: string,
    _messageId: Types.ObjectId,
    _sentAt: Date,
  ) {
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

  normalizeRealtimeError(error: unknown, conversationId?: string): RealtimeErrorPayload {
    if (error instanceof ForbiddenException) {
      return {
        code: 'FORBIDDEN',
        message: 'You are not an active participant of this conversation',
        conversationId,
      }
    }

    if (error instanceof BadRequestException || error instanceof ServiceUnavailableException) {
      const response = error.getResponse() as { code?: string; message?: string | string[] }
      const message = Array.isArray(response.message)
        ? response.message[0]
        : response.message ?? 'Chat error'

      return {
        code: response.code ?? 'BAD_REQUEST',
        message,
        conversationId,
      }
    }

    return {
      code: 'CHAT_ERROR',
      message: error instanceof Error ? error.message : 'Unknown chat error',
      conversationId,
    }
  }

  private async buildSenderPresentation(senderId: Types.ObjectId | { toString(): string }) {
    const sender = await this.authService.findById(senderId.toString())

    return {
      senderDisplayName: sender?.displayName,
      senderAvatarUrl: sender?.avatarUrl,
    }
  }

  private buildAttachmentPayload(input: {
    attachment?: { attachmentId: Types.ObjectId | { toString(): string }; fileName: string; mimeType: string; sizeBytes: number; isImage: boolean }
    senderId: Types.ObjectId | { toString(): string }
    conversationId: Types.ObjectId | { toString(): string }
    messageId: Types.ObjectId | { toString(): string }
  }): ChatAttachmentPayload | undefined {
    if (!input.attachment) {
      return undefined
    }

    return {
      attachmentId: input.attachment.attachmentId.toString(),
      fileName: input.attachment.fileName,
      mimeType: input.attachment.mimeType,
      sizeBytes: input.attachment.sizeBytes,
      isImage: input.attachment.isImage,
      uploaderId: input.senderId.toString(),
      conversationId: input.conversationId.toString(),
      messageId: input.messageId.toString(),
    }
  }

  private buildMessagePreview(message: {
    content: string
    attachment?: {
      fileName: string
      isImage: boolean
    }
  }) {
    if (message.attachment) {
      return message.attachment.isImage
        ? `[Ảnh] ${message.attachment.fileName}`
        : `[Tệp] ${message.attachment.fileName}`
    }

    return message.content
  }

  private async toDisplayMessage<T extends {
    _id?: Types.ObjectId | { toString(): string }
    content: string
    senderId: Types.ObjectId | { toString(): string }
    conversationId: Types.ObjectId | { toString(): string }
    reverseEncryptionState?: ReverseEncryptionState
    decodeErrorCode?: string
    attachment?: { attachmentId: Types.ObjectId | { toString(): string }; fileName: string; mimeType: string; sizeBytes: number; isImage: boolean }
  }>(message: T) {
    const senderPresentation = await this.buildSenderPresentation(message.senderId)

    try {
      const display = await this.chatEncryptionService.decryptForDisplay(
        message.content,
        message.reverseEncryptionState,
        {
          senderId: message.senderId.toString(),
          conversationId: message.conversationId.toString(),
        },
      )

      return {
        ...message,
        ...senderPresentation,
        content: display.content,
        decodeErrorCode: display.decodeErrorCode,
        displayState: display.displayState,
      }
    } catch (error) {
      const failureCode = error instanceof Error && 'code' in error && typeof error.code === 'string'
        ? error.code
        : 'REVERSE_DECRYPTION_UNAVAILABLE'

      return {
        ...message,
        ...senderPresentation,
        content: '[Không thể khôi phục nội dung tin nhắn]',
        decodeErrorCode: failureCode,
        displayState: 'decode_failed' as const,
      }
    }
  }
}
