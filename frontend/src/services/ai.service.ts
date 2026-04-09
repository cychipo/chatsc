import { io, Socket } from 'socket.io-client'
import { getAccessToken } from './http'
import { MessageModerationResult } from '../types/chat'

function resolveAiSocketUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL

  if (!configuredBaseUrl) {
    return `${window.location.origin}${import.meta.env.VITE_AI_SOCKET_NAMESPACE ?? '/ai'}`
  }

  const parsed = new URL(configuredBaseUrl, window.location.origin)
  return `${parsed.origin}${import.meta.env.VITE_AI_SOCKET_NAMESPACE ?? '/ai'}`
}

type AiAckSuccess<T> = { success: true; data: T }
type AiAckFailure = { success: false; error: { code: string; message: string } }
type AiAckResponse<T> = AiAckSuccess<T> | AiAckFailure

type ModerationListener = (payload: { conversationId: string; moderationResult: MessageModerationResult }) => void
type AiErrorPayload = { code: string; message: string; conversationId?: string }
type AiErrorListener = (payload: AiErrorPayload) => void

class FrontendAiService {
  private socket: Socket | null = null
  private moderationListeners = new Set<ModerationListener>()
  private errorListeners = new Set<AiErrorListener>()

  connect() {
    if (import.meta.env.VITE_AI_ENABLED === 'false') {
      return
    }

    if (this.socket) {
      if (!this.socket.connected) {
        this.socket.auth = { token: getAccessToken() }
        this.socket.connect()
      }
      return
    }

    this.socket = io(resolveAiSocketUrl(), {
      transports: ['websocket'],
      autoConnect: false,
      reconnection: true,
      auth: (callback) => callback({ token: getAccessToken() }),
    })

    this.socket.on('ai:moderation:result', (payload) => {
      for (const listener of this.moderationListeners) {
        listener(payload)
      }
    })

    this.socket.on('ai:error', (payload: AiErrorPayload) => {
      for (const listener of this.errorListeners) {
        listener(payload)
      }
    })

    this.socket.connect()
  }

  disconnect() {
    this.socket?.removeAllListeners()
    this.socket?.disconnect()
    this.socket = null
  }

  onModerationResult(listener: ModerationListener) {
    this.moderationListeners.add(listener)
    return () => this.moderationListeners.delete(listener)
  }

  onError(listener: AiErrorListener) {
    this.errorListeners.add(listener)
    return () => this.errorListeners.delete(listener)
  }

  async getSuggestions(conversationId: string) {
    if (!this.socket || !this.socket.connected) {
      return [] as string[]
    }

    const response = await this.socket.timeout(10000).emitWithAck('ai:suggestions:request', { conversationId }) as AiAckResponse<{ conversationId: string; suggestions: string[] }>
    if (!response.success) {
      throw response.error
    }
    return response.data.suggestions
  }
}

export const frontendAiService = new FrontendAiService()
