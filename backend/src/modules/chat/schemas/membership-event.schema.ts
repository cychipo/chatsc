import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'

export type MembershipEventDocument = HydratedDocument<MembershipEvent>

export type MembershipEventType = 'added' | 'joined' | 'left' | 'removed'

@Schema({ timestamps: true })
export class MembershipEvent {
  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true })
  conversationId!: Types.ObjectId

  @Prop({ required: true, enum: ['added', 'joined', 'left', 'removed'] })
  type!: MembershipEventType

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  targetUserId!: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'User' })
  actorUserId?: Types.ObjectId

  @Prop({ required: true, default: () => new Date() })
  occurredAt!: Date

  @Prop({ type: Object })
  metadata?: Record<string, unknown>
}

export const MembershipEventSchema = SchemaFactory.createForClass(MembershipEvent)

MembershipEventSchema.index({ conversationId: 1, occurredAt: -1 })
