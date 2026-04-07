import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'

export type ChatAttachmentDocument = HydratedDocument<ChatAttachment>

export type ChatAttachmentStatus = 'draft' | 'uploaded' | 'attached'

@Schema({ timestamps: true, collection: 'chat_attachments' })
export class ChatAttachment {
  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true })
  conversationId!: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  messageId?: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  uploaderId!: Types.ObjectId

  @Prop({ required: true })
  r2Key!: string

  @Prop({ required: true })
  originalName!: string

  @Prop({ required: true })
  mimeType!: string

  @Prop({ required: true })
  sizeBytes!: number

  @Prop({ required: true, default: false })
  isImage!: boolean

  @Prop({ required: true, enum: ['draft', 'uploaded', 'attached'], default: 'draft' })
  status!: ChatAttachmentStatus

  @Prop({ required: true, default: () => new Date() })
  createdAt!: Date

  @Prop()
  uploadedAt?: Date

  @Prop()
  confirmedAt?: Date
}

export const ChatAttachmentSchema = SchemaFactory.createForClass(ChatAttachment)

ChatAttachmentSchema.index({ conversationId: 1, createdAt: -1 })
ChatAttachmentSchema.index({ messageId: 1 })
ChatAttachmentSchema.index({ uploaderId: 1 })
