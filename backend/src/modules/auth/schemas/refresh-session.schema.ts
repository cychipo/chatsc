import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'

export type RefreshSessionDocument = HydratedDocument<RefreshSession>

@Schema({ timestamps: true })
export class RefreshSession {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId

  @Prop({ required: true, unique: true })
  tokenHash!: string

  @Prop({ required: true })
  issuedAt!: Date

  @Prop({ required: true, index: true })
  expiresAt!: Date

  @Prop()
  lastUsedAt?: Date

  @Prop()
  revokedAt?: Date

  @Prop({ required: true, default: 'active' })
  status!: 'active' | 'expired' | 'revoked'

  @Prop({ required: true, default: 'google-login' })
  createdBy!: string
}

export const RefreshSessionSchema = SchemaFactory.createForClass(RefreshSession)
