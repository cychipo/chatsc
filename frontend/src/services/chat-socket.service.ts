import { io, Socket } from 'socket.io-client'
import {
  ChatConnectionState,
  ChatSocketError,
  ConversationPreviewUpdate,
  MarkConversationReadResponse,
  RealtimeMessage,
  TypingPresenceUpdate,
} from '../types/chat'
import { getAccessToken } from './http'

type AckSuccess<T> = {
  success: true
  data: T
}

type AckFailure = {
  success: false
  error: ChatSocketError
}

type AckResponse<T> = AckSuccess<T> | AckFailure

type MessageListener = (message: RealtimeMessage) => void

type PreviewListener = (preview: ConversationPreviewUpdate) => void

type ConnectionListener = (state: ChatConnectionState) => void

type ReadListener = (payload: MarkConversationReadResponse) => void

type TypingListener = (payload: TypingPresenceUpdate) => void

type ErrorListener = (error: ChatSocketError) => void

function resolveSocketUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL

  if (!configuredBaseUrl) {
    return `${window.location.origin}/chat`
  }

  const parsed = new URL(configuredBaseUrl, window.location.origin)
  return `${parsed.origin}/chat`
}

class ChatSocketService {
  private socket: Socket | null = null
  private connectionState: ChatConnectionState = 'disconnected'
  private activeConversationId: string | null = null
  private messageListeners = new Set<MessageListener>()
  private previewListeners = new Set<PreviewListener>()
  private connectionListeners = new Set<ConnectionListener>()
  private readListeners = new Set<ReadListener>()
  private typingListeners = new Set<TypingListener>()
  private errorListeners = new Set<ErrorListener>()

  connect() {
    if (this.socket) {
      if (!this.socket.connected) {
        this.updateAuth()
        this.socket.connect()
      }
      return
    }

    this.setConnectionState('connecting')

    this.socket = io(resolveSocketUrl(), {
      transports: ['websocket'],
      autoConnect: false,
      reconnection: true,
      auth: (callback) => {
        callback({ token: getAccessToken() })
      },
    })

    this.socket.on('connect', () => {
      this.setConnectionState('connected')
      if (this.activeConversationId) {
        void this.joinConversation(this.activeConversationId)
      }
    })

    this.socket.on('disconnect', () => {
      this.setConnectionState('disconnected')
    })

    this.socket.io.on('reconnect_attempt', () => {
      this.updateAuth()
      this.setConnectionState('reconnecting')
    })

    this.socket.on('connect_error', (error: Error & { data?: ChatSocketError }) => {
      this.setConnectionState(this.socket?.active ? 'reconnecting' : 'disconnected')
      this.emitError(error.data ?? { code: 'CONNECTION_ERROR', message: error.message })
    })

    this.socket.on('message_delivered', (message: RealtimeMessage) => {
      for (const listener of this.messageListeners) {
        listener(message)
      }
    })

    this.socket.on('conversation_preview_updated', (preview: ConversationPreviewUpdate) => {
      for (const listener of this.previewListeners) {
        listener(preview)
      }
    })

    this.socket.on('conversation_read_updated', (payload: MarkConversationReadResponse) => {
      for (const listener of this.readListeners) {
        listener(payload)
      }
    })

    this.socket.on('typing_presence_updated', (payload: TypingPresenceUpdate) => {
      for (const listener of this.typingListeners) {
        listener(payload)
      }
    })

    this.socket.on('connection_status_changed', (payload: { state?: ChatConnectionState }) => {
      if (payload.state) {
        this.setConnectionState(payload.state)
      }
    })

    this.socket.connect()
  }

  disconnect() {
    this.activeConversationId = null
    if (!this.socket) {
      this.setConnectionState('disconnected')
      return
    }

    this.socket.removeAllListeners()
    this.socket.disconnect()
    this.socket = null
    this.setConnectionState('disconnected')
  }

  onMessage(listener: MessageListener) {
    this.messageListeners.add(listener)
    return () => this.messageListeners.delete(listener)
  }

  onPreview(listener: PreviewListener) {
    this.previewListeners.add(listener)
    return () => this.previewListeners.delete(listener)
  }

  onConnectionState(listener: ConnectionListener) {
    this.connectionListeners.add(listener)
    listener(this.connectionState)
    return () => this.connectionListeners.delete(listener)
  }

  onRead(listener: ReadListener) {
    this.readListeners.add(listener)
    return () => this.readListeners.delete(listener)
  }

  onTyping(listener: TypingListener) {
    this.typingListeners.add(listener)
    return () => this.typingListeners.delete(listener)
  }

  onError(listener: ErrorListener) {
    this.errorListeners.add(listener)
    return () => this.errorListeners.delete(listener)
  }

  getConnectionState() {
    return this.connectionState
  }

  async joinConversation(conversationId: string) {
    this.activeConversationId = conversationId
    await this.emitWithAck<{ conversationId: string }>('join_conversation', { conversationId })
  }

  async leaveConversation(conversationId: string) {
    if (this.activeConversationId === conversationId) {
      this.activeConversationId = null
    }
    await this.emitWithAck<{ conversationId: string }>('leave_conversation', { conversationId })
  }

  async sendMessage(conversationId: string, content: string, attachmentId?: string) {
    return this.emitWithAck<RealtimeMessage>('send_message', {
      conversationId,
      content,
      attachmentId,
    })
  }

  async markConversationRead(conversationId: string) {
    return this.emitWithAck<MarkConversationReadResponse>('mark_conversation_read', {
      conversationId,
    })
  }

  async updateTypingPresence(conversationId: string, isTyping: boolean) {
    return this.emitWithAck<{ conversationId: string; isTyping: boolean }>('typing_presence_updated', {
      conversationId,
      isTyping,
    })
  }

  private async emitWithAck<T>(event: string, payload: Record<string, unknown>) {
    const socket = this.socket

    if (!socket) {
      const error = { code: 'SOCKET_NOT_READY', message: 'Realtime chat is not connected' }
      this.emitError(error)
      throw error
    }

    if (!socket.connected) {
      const error = { code: 'SOCKET_NOT_READY', message: 'Realtime chat is not connected' }
      this.emitError(error)
      throw error
    }

    const response = await socket.timeout(5000).emitWithAck(event, payload) as AckResponse<T>

    if (!response.success) {
      this.emitError(response.error)
      throw response.error
    }

    return response.data
  }

  private emitError(error: ChatSocketError) {
    for (const listener of this.errorListeners) {
      listener(error)
    }
  }

  private setConnectionState(state: ChatConnectionState) {
    this.connectionState = state
    for (const listener of this.connectionListeners) {
      listener(state)
    }
  }

  private updateAuth() {
    if (!this.socket) {
      return
    }

    this.socket.auth = { token: getAccessToken() }
  }
}

export const chatSocketService = new ChatSocketService()
