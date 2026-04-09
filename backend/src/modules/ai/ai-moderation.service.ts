import { Injectable } from '@nestjs/common'
import { AiConfigService } from './ai-config.service'
import { AiService } from './ai.service'
import { ModerationResultDto } from './dto/moderation-result.dto'

@Injectable()
export class AiModerationService {
  constructor(
    private readonly aiConfigService: AiConfigService,
    private readonly aiService: AiService,
  ) {}

  async analyzeMessage(messageId: string, content: string): Promise<ModerationResultDto> {
    const result = await this.aiService.generateJson<ModerationResultDto>({
      model: this.aiConfigService.getCurrentModel(),
      responseMimeType: 'application/json',
      timeoutMs: this.aiConfigService.getModerationTimeoutMs(),
      messages: [
        {
          role: 'user',
          text: [
            'Analyze the following chat message and return JSON only.',
            'JSON shape: {"sentiment":"positive|neutral|negative","sentimentScore":number,"toxicityScore":number,"isToxic":boolean,"warningMessage":string}',
            'warningMessage should be empty when isToxic is false.',
            'warningMessage must be in Vietnamese when isToxic is true.',
            `Message: ${content}`,
          ].join('\n'),
        },
      ],
    })

    const warningMessage = typeof result.warningMessage === 'string'
      ? result.warningMessage.trim()
      : ''

    return {
      messageId,
      sentiment: result.sentiment ?? 'neutral',
      sentimentScore: Number(result.sentimentScore ?? 0),
      toxicityScore: Number(result.toxicityScore ?? 0),
      isToxic: Boolean(result.isToxic),
      warningMessage: this.normalizeWarningMessage(warningMessage, Boolean(result.isToxic)),
    }
  }

  private normalizeWarningMessage(warningMessage: string, isToxic: boolean) {
    if (!isToxic) {
      return undefined
    }

    if (!warningMessage) {
      return 'Nội dung này có thể gây khó chịu.'
    }

    const normalized = warningMessage.toLowerCase()
    if (normalized.includes('offensive language') || normalized.includes('offensive') || normalized.includes('toxic')) {
      return 'Nội dung này có thể gây khó chịu.'
    }

    return warningMessage
  }
}
