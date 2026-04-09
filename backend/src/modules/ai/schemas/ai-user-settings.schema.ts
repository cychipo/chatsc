import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'

export type AiUserSettingsDocument = HydratedDocument<AiUserSettings>

@Schema({ timestamps: true })
export class AiUserSettings {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId!: Types.ObjectId

  @Prop({ default: true })
  chatbotEnabled!: boolean

  @Prop({ default: true })
  suggestionsEnabled!: boolean

  @Prop({ default: true })
  moderationEnabled!: boolean
}

export const AiUserSettingsSchema = SchemaFactory.createForClass(AiUserSettings)
