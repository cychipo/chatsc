import { Injectable } from '@nestjs/common'
import { backendEnv } from '../../config/env.config'

export type AiKeyState = {
  apiKey: string
  consecutiveFailures: number
  isRateLimited: boolean
  lastErrorAt?: Date
}

@Injectable()
export class AiConfigService {
  private readonly env = backendEnv()
  private keyIndex = 0
  private modelIndex = 0
  private readonly keyStates: AiKeyState[]

  constructor() {
    this.keyStates = this.getApiKeys().map((apiKey) => ({
      apiKey,
      consecutiveFailures: 0,
      isRateLimited: false,
    }))
  }

  getApiKeys() {
    return this.env.GEMINI_API_KEYS.split(',').map((item) => item.trim()).filter(Boolean)
  }

  getModels() {
    return this.env.GEMINI_MODELS.split(',').map((item) => item.trim()).filter(Boolean)
  }

  getCurrentApiKey() {
    const keys = this.getApiKeys()
    if (keys.length === 0) {
      return null
    }

    return keys[this.keyIndex % keys.length] ?? null
  }

  getCurrentModel() {
    const models = this.getModels()
    return models[this.modelIndex % models.length] ?? 'gemini-1.5-flash'
  }

  getRequestTimeoutMs() {
    return this.env.GEMINI_REQUEST_TIMEOUT_MS
  }

  getModerationTimeoutMs() {
    return this.env.GEMINI_MODERATION_TIMEOUT_MS
  }

  getSuggestionTimeoutMs() {
    return this.env.GEMINI_SUGGESTION_TIMEOUT_MS
  }

  getMaxContextMessages() {
    return this.env.GEMINI_MAX_CONTEXT_MESSAGES
  }

  isChatbotEnabled() {
    return this.env.AI_CHATBOT_ENABLED
  }

  isSuggestionsEnabled() {
    return this.env.AI_SUGGESTIONS_ENABLED
  }

  isModerationEnabled() {
    return this.env.AI_MODERATION_ENABLED
  }

  rotateApiKey() {
    const keys = this.getApiKeys()
    if (keys.length > 0) {
      this.keyIndex = (this.keyIndex + 1) % keys.length
    }
    return this.getCurrentApiKey()
  }

  rotateModel() {
    const models = this.getModels()
    if (models.length > 0) {
      this.modelIndex = (this.modelIndex + 1) % models.length
    }
    return this.getCurrentModel()
  }

  markKeyFailure(apiKey: string, isRateLimited = false) {
    const state = this.keyStates.find((item) => item.apiKey === apiKey)
    if (!state) {
      return
    }

    state.consecutiveFailures += 1
    state.isRateLimited = isRateLimited
    state.lastErrorAt = new Date()
  }

  markKeySuccess(apiKey: string) {
    const state = this.keyStates.find((item) => item.apiKey === apiKey)
    if (!state) {
      return
    }

    state.consecutiveFailures = 0
    state.isRateLimited = false
    state.lastErrorAt = undefined
  }

  getKeyStates() {
    return this.keyStates.map((item) => ({ ...item }))
  }
}
