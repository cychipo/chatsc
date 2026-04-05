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
import { ChatService, ConversationPreviewPayload, RealtimeMessagePayload } from './chat.service'
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
      const message = await this.chatService.sendRealtimeMessage(payload.conversationId, user.id, content)
      const preview = await this.chatService.buildConversationPreviewPayload(payload.conversationId)
      await this.emitConversationPreview(payload.conversationId, preview)
      this.server.to(getConversationRoom(payload.conversationId)).emit('message_delivered', message)
      return { success: true, data: message }
    } catch (error) {
      return this.toErrorAck(error, payload.conversationId)
    }
  }

  private async emitConversationPreview(conversationId: string, preview: ConversationPreviewPayload) {
    const participants = await this.chatService.getActiveParticipants(conversationId)

    for (const participant of participants) {
      this.server
        .to(getUserRoom(participant.userId.toString()))
        .emit('conversation_preview_updated', preview)
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
