import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'

export type UserDocument = HydratedDocument<User>

@Schema({ _id: false })
class LocalAuthMetadata {
  @Prop({ default: false })
  enabled!: boolean

  @Prop()
  passwordSha1?: string

  @Prop()
  passwordUpdatedAt?: Date

  @Prop()
  createdVia?: string
}

const LocalAuthMetadataSchema = SchemaFactory.createForClass(LocalAuthMetadata)

@Schema({ timestamps: true })
export class User {
  @Prop({ unique: true, sparse: true })
  googleId?: string

  @Prop({ required: true, unique: true })
  email!: string

  @Prop({ required: true, unique: true })
  username!: string

  @Prop({ required: true })
  displayName!: string

  @Prop()
  avatarUrl?: string

  @Prop({ default: 'active' })
  status!: string

  @Prop({ type: Types.ObjectId, ref: 'AiUserSettings' })
  aiSettings?: Types.ObjectId

  @Prop({ type: LocalAuthMetadataSchema })
  localAuth?: LocalAuthMetadata
}

export const UserSchema = SchemaFactory.createForClass(User)
