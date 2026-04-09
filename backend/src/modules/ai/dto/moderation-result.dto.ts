export type MessageSentiment = 'positive' | 'neutral' | 'negative'

export class ModerationResultDto {
  messageId!: string
  sentiment!: MessageSentiment
  sentimentScore!: number
  toxicityScore!: number
  isToxic!: boolean
  warningMessage?: string
}
