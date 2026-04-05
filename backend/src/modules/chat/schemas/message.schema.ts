import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'

export type MessageDocument = HydratedDocument<Message>

export type DeliveryStatus = 'sent' | 'failed'

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true })
  conversationId!: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId!: Types.ObjectId

  @Prop({ required: true })
  content!: string

  @Prop({ required: true, default: () => new Date() })
  sentAt!: Date

  @Prop({ required: true, enum: ['sent', 'failed'], default: 'sent' })
  deliveryStatus!: DeliveryStatus

  @Prop()
  decodeErrorCode?: string
}

export const MessageSchema = SchemaFactory.createForClass(Message)

MessageSchema.index({ conversationId: 1, sentAt: -1 })
MessageSchema.index({ conversationId: 1, _id: -1 })
