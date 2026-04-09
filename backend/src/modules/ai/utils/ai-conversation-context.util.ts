import { Types } from 'mongoose'

export type AiConversationMessage = {
  role: 'user' | 'model'
  text: string
}

export function toAiConversationContext(messages: Array<{ senderId: { toString(): string } | string; content: string }>, botUserId?: string) {
  return messages
    .map((message) => ({
      role: botUserId && message.senderId.toString() === botUserId ? 'model' as const : 'user' as const,
      text: message.content,
    }))
    .filter((message) => message.text.trim().length > 0)
}

export function normalizeConversationContext(messages: AiConversationMessage[], maxMessages: number) {
  return messages.slice(Math.max(messages.length - maxMessages, 0))
}

export function toObjectId(id: string) {
  return new Types.ObjectId(id)
}
