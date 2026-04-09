import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'

export type MessageDocument = HydratedDocument<Message>

export type DeliveryStatus = 'sent' | 'failed'
export type SeenState = 'sent' | 'seen'
export type ReverseEncryptionState = 'legacy' | 'encrypted' | 'decode_failed'

export class MessageModerationResult {
  @Prop({ enum: ['positive', 'neutral', 'negative'], required: false })
  sentiment?: 'positive' | 'neutral' | 'negative'

  @Prop({ required: false })
  sentimentScore?: number

  @Prop({ required: false })
  toxicityScore?: number

  @Prop({ required: false })
  isToxic?: boolean

  @Prop({ required: false })
  warningMessage?: string
}

export class MessageAttachment {
  @Prop({ type: Types.ObjectId, ref: 'ChatAttachment', required: true })
  attachmentId!: Types.ObjectId

  @Prop({ required: true })
  fileName!: string

  @Prop({ required: true })
  mimeType!: string

  @Prop({ required: true })
  sizeBytes!: number

  @Prop({ required: true })
  isImage!: boolean
}

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true })
  conversationId!: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId!: Types.ObjectId

  @Prop({ required: false, default: '' })
  content!: string

  @Prop({ required: true, enum: ['legacy', 'encrypted', 'decode_failed'], default: 'legacy' })
  reverseEncryptionState!: ReverseEncryptionState

  @Prop()
  encryptedContentVersion?: string

  @Prop({ required: true, default: () => new Date() })
  sentAt!: Date

  @Prop({ required: true, enum: ['sent', 'failed'], default: 'sent' })
  deliveryStatus!: DeliveryStatus

  @Prop({ required: true, enum: ['sent', 'seen'], default: 'sent' })
  seenState!: SeenState

  @Prop()
  decodeErrorCode?: string

  @Prop({ default: false })
  isAIBotMessage!: boolean

  @Prop({ default: false })
  isAICommand!: boolean

  @Prop({ type: MessageModerationResult, required: false })
  moderationResult?: MessageModerationResult

  @Prop({ type: MessageAttachment, required: false })
  attachment?: MessageAttachment
}

export const MessageSchema = SchemaFactory.createForClass(Message)

MessageSchema.index({ conversationId: 1, sentAt: -1 })
MessageSchema.index({ conversationId: 1, _id: -1 })
