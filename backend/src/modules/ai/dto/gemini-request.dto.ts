export type GeminiRole = 'user' | 'model'

export type GeminiRequestMessageDto = {
  role: GeminiRole
  text: string
}

export class GeminiRequestDto {
  model!: string
  messages!: GeminiRequestMessageDto[]
  responseMimeType?: 'text/plain' | 'application/json'
  timeoutMs?: number
}
