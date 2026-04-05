import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'

export type ConversationDocument = HydratedDocument<Conversation>

export type ConversationType = 'direct' | 'group'

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ required: true, enum: ['direct', 'group'] })
  type!: ConversationType

  @Prop()
  title?: string

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId

  @Prop()
  lastMessageAt?: Date
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation)

ConversationSchema.index({ createdBy: 1 })
ConversationSchema.index({ lastMessageAt: -1 })
