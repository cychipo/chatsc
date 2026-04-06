import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'

export type ConversationParticipantDocument = HydratedDocument<ConversationParticipant>

export type ParticipantRole = 'member' | 'admin' | 'owner'
export type ParticipantStatus = 'active' | 'left' | 'removed'

@Schema({ timestamps: true })
export class ConversationParticipant {
  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true })
  conversationId!: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId

  @Prop({ required: true, enum: ['member', 'admin', 'owner'], default: 'member' })
  role!: ParticipantRole

  @Prop({ required: true, enum: ['active', 'left', 'removed'], default: 'active' })
  status!: ParticipantStatus

  @Prop({ type: Types.ObjectId, ref: 'User' })
  addedBy?: Types.ObjectId

  @Prop({ required: true, default: () => new Date() })
  joinedAt!: Date

  @Prop()
  leftAt?: Date

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  lastReadMessageId?: Types.ObjectId

  @Prop()
  lastReadAt?: Date

  @Prop({ required: true, default: 0 })
  unreadCount!: number
}

export const ConversationParticipantSchema = SchemaFactory.createForClass(ConversationParticipant)

ConversationParticipantSchema.index({ conversationId: 1, userId: 1 })
ConversationParticipantSchema.index({ conversationId: 1, status: 1 })
ConversationParticipantSchema.index({ userId: 1, status: 1 })
