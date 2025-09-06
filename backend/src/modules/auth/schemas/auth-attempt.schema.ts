import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type AuthAttemptDocument = HydratedDocument<AuthAttempt>

export type AuthProvider = 'google' | 'local-register' | 'local-login' | 'refresh-token'

@Schema({ timestamps: true })
export class AuthAttempt {
  @Prop({ required: true, default: 'google' })
  provider!: AuthProvider

  @Prop()
  emailCandidate?: string

  @Prop({ required: true })
  result!: string

  @Prop()
  failureReason?: string

  @Prop()
  userId?: string

  @Prop()
  sessionId?: string
}

export const AuthAttemptSchema = SchemaFactory.createForClass(AuthAttempt)
