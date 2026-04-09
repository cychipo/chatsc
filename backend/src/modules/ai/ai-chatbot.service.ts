import { Injectable } from '@nestjs/common'
import { ChatService } from '../chat/chat.service'
import { AiConfigService } from './ai-config.service'
import { AiService } from './ai.service'
import { normalizeConversationContext, toAiConversationContext } from './utils/ai-conversation-context.util'

@Injectable()
export class AiChatbotService {
  constructor(
    private readonly chatService: ChatService,
    private readonly aiConfigService: AiConfigService,
    private readonly aiService: AiService,
  ) {}

  shouldReply(content: string) {
    const trimmed = content.trim()
    return trimmed.startsWith('/ai') || trimmed.includes('@chatai')
  }

  buildPrompt(content: string) {
    return content.replace('@chatai', '').replace('/ai', '').trim()
  }

  async generateResponse(conversationId: string, content: string) {
    const prompt = this.buildPrompt(content)
    const messages = await this.chatService.getMessages(conversationId, undefined, this.aiConfigService.getMaxContextMessages())
    const context = normalizeConversationContext(
      toAiConversationContext(messages.map((message) => ({
        senderId: message.senderId,
        content: message.content,
      }))),
      this.aiConfigService.getMaxContextMessages(),
    )

    const text = await this.aiService.generateText({
      model: this.aiConfigService.getCurrentModel(),
      timeoutMs: this.aiConfigService.getRequestTimeoutMs(),
      messages: [
        {
          role: 'user',
          text: [
            'You are a helpful chat assistant inside a realtime messaging app.',
            'Answer concisely in Vietnamese unless the user clearly asks for another language.',
            'Recent conversation context:',
            ...context.map((message) => `${message.role}: ${message.text}`),
            `Current user request: ${prompt || content.trim()}`,
          ].join('\n'),
        },
      ],
    })

    return text.trim()
  }
}
