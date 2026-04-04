import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type AuthAttemptDocument = HydratedDocument<AuthAttempt>

@Schema({ timestamps: true })
export class AuthAttempt {
  @Prop({ required: true, default: 'google' })
  provider!: string

  @Prop()
  emailCandidate?: string

  @Prop({ required: true })
  result!: 'started' | 'cancelled' | 'failed' | 'succeeded'

  @Prop()
  failureReason?: string
}

export const AuthAttemptSchema = SchemaFactory.createForClass(AuthAttempt)
