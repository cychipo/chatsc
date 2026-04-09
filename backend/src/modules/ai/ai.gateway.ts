import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { AuthService } from '../auth/auth.service'
import { SessionUser } from '../auth/types/auth-session'
import { ChatService } from '../chat/chat.service'
import { authenticateSocketClient } from '../chat/utils/socket-auth.util'
import { getConversationRoom, getUserRoom } from '../chat/utils/socket-conversation.util'
import { AiChatbotService } from './ai-chatbot.service'
import { AiConfigService } from './ai-config.service'
import { AiSuggestionsService } from './ai-suggestions.service'

const AI_ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  AI_DISABLED: 'AI_DISABLED',
  AI_ERROR: 'AI_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  TIMEOUT: 'TIMEOUT',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DISABLED: 'DISABLED',
} as const

type AiSocketData = {
  user?: SessionUser
}

@WebSocketGateway({
  namespace: '/ai',
  cors: { origin: true, credentials: true },
  transports: ['websocket'],
})
export class AiGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  server!: Server

  constructor(
    private readonly authService: AuthService,
    private readonly chatService: ChatService,
    private readonly aiConfigService: AiConfigService,
    private readonly aiChatbotService: AiChatbotService,
    private readonly aiSuggestionsService: AiSuggestionsService,
  ) {}

  afterInit(server: Server) {
    server.use(async (client, next) => {
      const user = await authenticateSocketClient(client, this.authService)
      if (!user) {
        const error = new Error('Unauthorized') as Error & { data?: { code: string; message: string } }
        error.data = { code: AI_ERROR_CODES.UNAUTHORIZED, message: 'Access token is required or invalid' }
        next(error)
        return
      }
      ;(client.data as AiSocketData).user = user
      next()
    })
  }

  handleConnection(client: Socket) {
    const user = this.getClientUser(client)
    client.join(getUserRoom(user.id))
  }

  @SubscribeMessage('ai:chat')
  async handleAiChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string; content: string },
  ) {
    const user = this.getClientUser(client)
    try {
      if (!this.aiConfigService.isChatbotEnabled()) {
        const error = { code: AI_ERROR_CODES.DISABLED, message: 'AI chatbot is disabled' }
        this.emitError(client, error)
        return { success: false, error }
      }
      await this.chatService.getRequiredActiveParticipant(payload.conversationId, user.id)
      const content = await this.aiChatbotService.generateResponse(payload.conversationId, payload.content)
      this.server.to(getConversationRoom(payload.conversationId)).emit('ai:response', {
        conversationId: payload.conversationId,
        content,
      })
      return { success: true, data: { conversationId: payload.conversationId, content } }
    } catch (error) {
      const ack = this.toErrorAck(error)
      this.emitError(client, ack.error)
      return ack
    }
  }

  @SubscribeMessage('ai:suggestions:request')
  async handleSuggestions(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string },
  ) {
    const user = this.getClientUser(client)
    try {
      if (!this.aiConfigService.isSuggestionsEnabled()) {
        const error = { code: AI_ERROR_CODES.DISABLED, message: 'AI suggestions are disabled' }
        this.emitError(client, error)
        return { success: false, error }
      }
      await this.chatService.getRequiredActiveParticipant(payload.conversationId, user.id)
      const suggestions = await this.aiSuggestionsService.generateSuggestions(payload.conversationId)
      return { success: true, data: { conversationId: payload.conversationId, suggestions } }
    } catch (error) {
      const ack = this.toErrorAck(error)
      this.emitError(client, ack.error)
      return ack
    }
  }

  private emitError(client: Socket, error: { code: string; message: string; conversationId?: string }) {
    client.emit('ai:error', error)
  }

  private getClientUser(client: Socket) {
    const user = (client.data as AiSocketData).user
    if (!user) {
      throw new Error('Socket user is missing')
    }
    return user
  }

  private toErrorAck(error: unknown) {
    return {
      success: false,
      error: {
        code: this.mapErrorCode(error),
        message: this.getErrorMessage(error),
      },
    }
  }

  private mapErrorCode(error: unknown) {
    const payload = this.getErrorPayload(error)
    const code = payload?.code

    switch (code) {
      case 'AI_TIMEOUT':
        return AI_ERROR_CODES.TIMEOUT
      case 'AI_MISSING_API_KEY':
      case 'AI_MISSING_MODEL':
      case 'AI_SERVICE_UNAVAILABLE':
        return AI_ERROR_CODES.SERVICE_UNAVAILABLE
      case 'AI_DISABLED':
        return AI_ERROR_CODES.DISABLED
      default: {
        const message = this.getErrorMessage(error)
        if (message.includes('429') || message.includes('quota') || message.includes('RESOURCE_EXHAUSTED')) {
          return AI_ERROR_CODES.RATE_LIMITED
        }
        return AI_ERROR_CODES.AI_ERROR
      }
    }
  }

  private getErrorMessage(error: unknown) {
    const payload = this.getErrorPayload(error)
    if (payload?.message && typeof payload.message === 'string') {
      return payload.message
    }
    return error instanceof Error ? error.message : 'AI error'
  }

  private getErrorPayload(error: unknown) {
    if (typeof error !== 'object' || error === null || !('response' in error)) {
      return undefined
    }

    const response = (error as { response?: { message?: unknown } }).response
    if (!response || typeof response.message !== 'object' || response.message === null) {
      return undefined
    }

    return response.message as { code?: string; message?: string }
  }
}
