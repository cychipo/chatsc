import { BadRequestException, ForbiddenException, Injectable, ServiceUnavailableException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { AuthService } from '../auth/auth.service'
import { SessionUser } from '../auth/types/auth-session'
import { ChatEncryptionService } from './chat-encryption.service'
import { Conversation, ConversationDocument } from './schemas/conversation.schema'
import { ConversationParticipant, ConversationParticipantDocument } from './schemas/conversation-participant.schema'
import { Message, MessageDocument, ReverseEncryptionState } from './schemas/message.schema'
import { MembershipEvent, MembershipEventDocument } from './schemas/membership-event.schema'

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
  directPeer?: SessionUser
}

export type MessageDisplayState = 'ready' | 'decode_failed'

export type RealtimeMessagePayload = {
  messageId: string
  conversationId: string
  senderId: string
  content: string
  sentAt: string
  decodeErrorCode?: string
  displayState?: MessageDisplayState
}

export type ConversationPreviewPayload = {
  conversationId: string
  lastMessagePreview: string
  lastMessageAt: string
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
    private authService: AuthService,
    private chatEncryptionService: ChatEncryptionService,
  ) {}

  async listConversationsForUser(userId: string): Promise<ConversationSummary[]> {
    const participations = await this.participantModel
      .find({ userId: new Types.ObjectId(userId), status: 'active' })
      .lean()
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

        if (conversation.type === 'direct') {
          const participants = await this.participantModel
            .find({ conversationId: conversation._id, status: 'active' })
            .lean()
          const peerParticipant = participants.find((participant) => participant.userId.toString() !== userId)
          const directPeer = peerParticipant
            ? await this.authService.findById(peerParticipant.userId.toString())
            : null
          const displayTitle = directPeer?.displayName ?? conversation.title ?? 'Đoạn chat mới'

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
            lastMessagePreview: latestMessage ? (await this.toDisplayMessage(latestMessage)).content : undefined,
            directPeer: directPeer ?? undefined,
          }
        }

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
          lastMessagePreview: latestMessage ? (await this.toDisplayMessage(latestMessage)).content : undefined,
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
    const activeParticipants = await this.participantModel
      .find({
        userId: { $in: [new Types.ObjectId(userAId), new Types.ObjectId(userBId)] },
        status: 'active',
      })
      .lean()

    const conversationIdsByUser = new Map<string, Set<string>>()

    for (const participant of activeParticipants) {
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
        .find({ conversationId: conversation._id, status: 'active' })
        .lean()

      if (participants.length === 2) {
        const participantIds = new Set(participants.map((participant) => participant.userId.toString()))
        if (participantIds.has(userAId) && participantIds.has(userBId)) {
          return conversation
        }
      }
    }

    return null
  }

  async sendMessage(conversationId: string, senderId: string, content: string) {
    const trimmedContent = content.trim()

    if (!trimmedContent) {
      throw new BadRequestException({
        code: 'EMPTY_MESSAGE',
        message: 'Message content cannot be empty',
      })
    }

    const encrypted = await this.chatEncryptionService.encryptForStorage(trimmedContent, {
      senderId,
      conversationId,
    })

    const message = await this.messageModel.create({
      conversationId: new Types.ObjectId(conversationId),
      senderId: new Types.ObjectId(senderId),
      content: encrypted.content,
      reverseEncryptionState: encrypted.reverseEncryptionState,
      encryptedContentVersion: encrypted.reverseEncryptionState === 'encrypted' ? 'reverse-v1' : undefined,
      sentAt: new Date(),
      deliveryStatus: 'sent',
      decodeErrorCode: encrypted.decodeErrorCode,
    })

    await this.conversationModel.updateOne(
      { _id: new Types.ObjectId(conversationId) },
      { lastMessageAt: message.sentAt },
    )

    return message
  }

  async sendRealtimeMessage(conversationId: string, senderId: string, content: string) {
    await this.getRequiredActiveParticipant(conversationId, senderId)
    const message = await this.sendMessage(conversationId, senderId, content)
    return this.toRealtimeMessagePayload(message)
  }

  async getMessages(conversationId: string, before?: string, limit = 10) {
    const query: Record<string, unknown> = { conversationId: new Types.ObjectId(conversationId) }
    if (before) {
      query.sentAt = { $lt: new Date(before) }
    }

    const messages = await this.messageModel.find(query).sort({ sentAt: -1 }).limit(Math.min(limit, 50)).lean()
    return Promise.all(messages.map((message) => this.toDisplayMessage(message)))
  }

  async buildConversationPreviewPayload(conversationId: string): Promise<ConversationPreviewPayload> {
    const latestMessage = await this.messageModel
      .findOne({ conversationId: new Types.ObjectId(conversationId) })
      .sort({ sentAt: -1 })
      .lean()

    const conversation = await this.conversationModel.findById(conversationId).lean()
    const previewMessage = latestMessage ? await this.toDisplayMessage(latestMessage) : null

    return {
      conversationId,
      lastMessagePreview: previewMessage?.content ?? '',
      lastMessageAt:
        latestMessage?.sentAt?.toISOString() ??
        conversation?.lastMessageAt?.toISOString() ??
        new Date().toISOString(),
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

      return {
        messageId: message._id.toString(),
        conversationId: message.conversationId.toString(),
        senderId: message.senderId.toString(),
        content: display.content,
        sentAt: message.sentAt.toISOString(),
        decodeErrorCode: display.decodeErrorCode,
        displayState: display.displayState,
      }
    } catch (error) {
      const failureCode = error instanceof Error && 'code' in error && typeof error.code === 'string'
        ? error.code
        : 'REVERSE_DECRYPTION_UNAVAILABLE'

      return {
        messageId: message._id.toString(),
        conversationId: message.conversationId.toString(),
        senderId: message.senderId.toString(),
        content: message.content,
        sentAt: message.sentAt.toISOString(),
        decodeErrorCode: failureCode,
        displayState: 'decode_failed' as const,
      }
    }
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

  private async toDisplayMessage<T extends {
    content: string
    senderId: Types.ObjectId | { toString(): string }
    conversationId: Types.ObjectId | { toString(): string }
    reverseEncryptionState?: ReverseEncryptionState
    decodeErrorCode?: string
  }>(message: T) {
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
        content: '[Không thể khôi phục nội dung tin nhắn]',
        decodeErrorCode: failureCode,
        displayState: 'decode_failed' as const,
      }
    }
  }
}
