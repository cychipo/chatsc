import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { AuthService } from '../auth/auth.service'
import { SessionUser } from '../auth/types/auth-session'
import {
  ChatService,
  ConversationPreviewPayload,
  MarkConversationReadPayload,
  RealtimeMessagePayload,
} from './chat.service'
import { authenticateSocketClient } from './utils/socket-auth.util'
import {
  getConversationRoom,
  getJoinedConversationIds,
  getUserRoom,
  markConversationJoined,
  markConversationLeft,
} from './utils/socket-conversation.util'
import { Server, Socket } from 'socket.io'

const CHAT_ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_MESSAGE: 'INVALID_MESSAGE',
  CHAT_ERROR: 'CHAT_ERROR',
} as const

type ChatSocketData = {
  user?: SessionUser
  joinedConversationIds?: string[]
}

type JoinConversationPayload = {
  conversationId: string
}

type LeaveConversationPayload = {
  conversationId: string
}

type SendMessagePayload = {
  conversationId: string
  content: string
  attachmentId?: string
}

type MarkConversationReadSocketPayload = {
  conversationId: string
}

type TypingPayload = {
  conversationId: string
  isTyping: boolean
}

type SocketAck<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; conversationId?: string } }

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: true,
    credentials: true,
  },
  transports: ['websocket'],
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server

  constructor(
    private readonly chatService: ChatService,
    private readonly authService: AuthService,
  ) {}

  afterInit(server: Server) {
    server.use(async (client, next) => {
      const user = await authenticateSocketClient(client, this.authService)

      if (!user) {
        const error = new Error('Unauthorized') as Error & { data?: { code: string; message: string } }
        error.data = {
          code: CHAT_ERROR_CODES.UNAUTHORIZED,
          message: 'Access token is required or invalid',
        }
        next(error)
        return
      }

      ;(client.data as ChatSocketData).user = user
      ;(client.data as ChatSocketData).joinedConversationIds = []
      next()
    })
  }

  handleConnection(client: Socket) {
    const user = this.getClientUser(client)
    client.join(getUserRoom(user.id))
    client.emit('connection_status_changed', { state: 'connected' })
  }

  handleDisconnect(client: Socket) {
    const joinedConversationIds = getJoinedConversationIds(client)

    for (const conversationId of joinedConversationIds) {
      client.leave(getConversationRoom(conversationId))
      markConversationLeft(client, conversationId)
    }
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinConversationPayload,
  ): Promise<SocketAck<{ conversationId: string }>> {
    const user = this.getClientUser(client)

    try {
      await this.chatService.getRequiredActiveParticipant(payload.conversationId, user.id)
      client.join(getConversationRoom(payload.conversationId))
      markConversationJoined(client, payload.conversationId)
      return { success: true, data: { conversationId: payload.conversationId } }
    } catch (error) {
      return this.toErrorAck(error, payload.conversationId)
    }
  }

  @SubscribeMessage('leave_conversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: LeaveConversationPayload,
  ): Promise<SocketAck<{ conversationId: string }>> {
    client.leave(getConversationRoom(payload.conversationId))
    markConversationLeft(client, payload.conversationId)
    return { success: true, data: { conversationId: payload.conversationId } }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendMessagePayload,
  ): Promise<SocketAck<RealtimeMessagePayload>> {
    const user = this.getClientUser(client)

    try {
      const content = payload.content.trim()
      const result = await this.chatService.sendRealtimeMessage(payload.conversationId, user.id, content, payload.attachmentId)
      await this.emitConversationPreviews(result.previewByUserId)
      await this.emitRealtimeMessage(payload.conversationId, result.previewByUserId.map((entry) => entry.userId), result.message)
      return { success: true, data: result.message }
    } catch (error) {
      return this.toErrorAck(error, payload.conversationId)
    }
  }

  @SubscribeMessage('mark_conversation_read')
  async handleMarkConversationRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: MarkConversationReadSocketPayload,
  ): Promise<SocketAck<MarkConversationReadPayload>> {
    const user = this.getClientUser(client)

    try {
      const result = await this.chatService.markConversationRead(payload.conversationId, user.id)
      const previews = await this.chatService.buildConversationPreviewPayloads(payload.conversationId)
      await this.emitConversationPreviews(previews)
      this.server
        .to(getUserRoom(user.id))
        .emit('conversation_read_updated', result)
      this.server
        .to(getConversationRoom(payload.conversationId))
        .emit('conversation_read_updated', result)
      return { success: true, data: result }
    } catch (error) {
      return this.toErrorAck(error, payload.conversationId)
    }
  }

  @SubscribeMessage('typing_presence_updated')
  async handleTypingPresence(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: TypingPayload,
  ): Promise<SocketAck<{ conversationId: string; isTyping: boolean }>> {
    const user = this.getClientUser(client)

    try {
      await this.chatService.getRequiredActiveParticipant(payload.conversationId, user.id)
      client.to(getConversationRoom(payload.conversationId)).emit('typing_presence_updated', {
        conversationId: payload.conversationId,
        userId: user.id,
        isTyping: payload.isTyping,
        expiresAt: new Date(Date.now() + 4000).toISOString(),
      })

      return {
        success: true,
        data: {
          conversationId: payload.conversationId,
          isTyping: payload.isTyping,
        },
      }
    } catch (error) {
      return this.toErrorAck(error, payload.conversationId)
    }
  }

  async emitConversationPreviews(entries: Array<{ userId: string; preview: ConversationPreviewPayload }>) {
    for (const entry of entries) {
      this.server
        .to(getUserRoom(entry.userId))
        .emit('conversation_preview_updated', entry.preview)
    }
  }

  async emitRealtimeMessage(
    conversationId: string,
    participantUserIds: string[],
    message: RealtimeMessagePayload,
  ) {
    this.server.to(getConversationRoom(conversationId)).emit('message_delivered', message)

    for (const userId of participantUserIds) {
      this.server
        .to(getUserRoom(userId))
        .emit('message_delivered', message)
    }
  }

  private getClientUser(client: Socket) {
    const user = (client.data as ChatSocketData).user

    if (!user) {
      throw new Error('Socket user is missing')
    }

    return user
  }

  private toErrorAck(error: unknown, conversationId?: string): SocketAck<never> {
    const normalized = this.chatService.normalizeRealtimeError(error, conversationId)
    return {
      success: false,
      error: normalized,
    }
  }
}
