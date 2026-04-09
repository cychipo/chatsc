import { Injectable } from '@nestjs/common'
import { ChatService } from '../chat/chat.service'
import { AiConfigService } from './ai-config.service'
import { AiService } from './ai.service'

@Injectable()
export class AiSuggestionsService {
  constructor(
    private readonly chatService: ChatService,
    private readonly aiConfigService: AiConfigService,
    private readonly aiService: AiService,
  ) {}

  async generateSuggestions(conversationId: string) {
    const messages = await this.chatService.getMessages(conversationId, undefined, 10)
    const recentMessages = messages.filter((message) => message.content.trim())
    const lastMessage = recentMessages.at(-1)

    if (!lastMessage) {
      return [] as string[]
    }

    const conversationContext = recentMessages
      .slice(-10)
      .map((message, index) => `Message ${index + 1}: ${message.content.trim()}`)
      .join('\n')

    const response = await this.aiService.generateJson<string[]>({
      model: this.aiConfigService.getCurrentModel(),
      responseMimeType: 'application/json',
      timeoutMs: this.aiConfigService.getSuggestionTimeoutMs(),
      messages: [
        {
          role: 'user',
          text: [
            'Generate exactly 3 short reply suggestions for this chat conversation.',
            'Base the reply language primarily on the latest 2-3 messages in the conversation.',
            'If the latest messages are in English, return English suggestions. If the latest messages are in Vietnamese, return Vietnamese suggestions.',
            'Use older messages only as supporting context, not as the main language signal.',
            'Match the tone and language of the most recent messages naturally.',
            'Each suggestion must be under 50 characters.',
            'Return ONLY a JSON array of exactly 3 strings.',
            'Recent conversation context:',
            conversationContext,
            `Latest message: ${lastMessage.content.trim()}`,
          ].join('\n'),
        },
      ],
    })

    return response.filter((item) => typeof item === 'string' && item.trim()).slice(0, 3)
  }
}
