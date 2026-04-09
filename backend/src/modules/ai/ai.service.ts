import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common'
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai'
import { AiConfigService } from './ai-config.service'
import { GeminiRequestDto } from './dto/gemini-request.dto'

@Injectable()
export class AiService {
  constructor(private readonly aiConfigService: AiConfigService) {}

  async generateText(request: GeminiRequestDto) {
    const parsed = await this.generateContent(request)
    return parsed.text
  }

  async generateJson<T>(request: GeminiRequestDto) {
    const parsed = await this.generateContent(request)

    try {
      return JSON.parse(parsed.text) as T
    } catch {
      throw new BadRequestException({
        code: 'AI_INVALID_RESPONSE',
        message: 'AI returned malformed JSON response',
      })
    }
  }

  private async generateContent(request: GeminiRequestDto) {
    const apiKeys = this.aiConfigService.getApiKeys()
    const models = request.model ? [request.model] : this.aiConfigService.getModels()

    if (apiKeys.length === 0) {
      throw new ServiceUnavailableException({
        code: 'AI_MISSING_API_KEY',
        message: 'Gemini API key is not configured',
      })
    }

    if (models.length === 0) {
      throw new ServiceUnavailableException({
        code: 'AI_MISSING_MODEL',
        message: 'Gemini model is not configured',
      })
    }

    let lastError: unknown

    for (let keyAttempt = 0; keyAttempt < apiKeys.length; keyAttempt += 1) {
      const apiKey = this.aiConfigService.getCurrentApiKey()
      const client = new GoogleGenerativeAI(apiKey ?? apiKeys[0])

      for (let modelAttempt = 0; modelAttempt < models.length; modelAttempt += 1) {
        const modelName = modelAttempt === 0 ? (request.model ?? this.aiConfigService.getCurrentModel()) : this.aiConfigService.rotateModel()

        try {
          const model = client.getGenerativeModel({
            model: modelName,
            safetySettings: [
              { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
              { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
              { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
              { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            ],
          })

          const generationPromise = model.generateContent({
            contents: request.messages.map((message) => ({
              role: message.role,
              parts: [{ text: message.text }],
            })),
            generationConfig: request.responseMimeType === 'application/json'
              ? { responseMimeType: 'application/json' }
              : undefined,
          })

          const result = await Promise.race([
            generationPromise,
            new Promise<never>((_, reject) => {
              setTimeout(() => {
                reject(new ServiceUnavailableException({
                  code: 'AI_TIMEOUT',
                  message: 'AI request timed out',
                }))
              }, request.timeoutMs ?? this.aiConfigService.getRequestTimeoutMs())
            }),
          ])

          const response = await result.response
          const text = response.text().trim()

          this.aiConfigService.markKeySuccess(apiKey ?? apiKeys[0])

          if (!text) {
            throw new BadRequestException({
              code: 'AI_EMPTY_RESPONSE',
              message: 'AI returned empty response',
            })
          }

          return { text, model: modelName, apiKey: apiKey ?? apiKeys[0] }
        } catch (error) {
          lastError = error
          const errorMessage = error instanceof Error ? error.message : String(error)
          const isRateLimited = errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')
          this.aiConfigService.markKeyFailure(apiKey ?? apiKeys[0], isRateLimited)

          if (modelAttempt < models.length - 1) {
            continue
          }
        }
      }

      this.aiConfigService.rotateApiKey()
    }

    throw lastError instanceof Error
      ? new ServiceUnavailableException({
        code: 'AI_SERVICE_UNAVAILABLE',
        message: lastError.message,
      })
      : new ServiceUnavailableException({
        code: 'AI_SERVICE_UNAVAILABLE',
        message: 'AI service is unavailable',
      })
  }
}
