import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { AuthAttempt, AuthAttemptDocument } from './schemas/auth-attempt.schema'
import { User, UserDocument } from './schemas/user.schema'
import { deriveBaseUsername, resolveUsernameCollision } from './utils/username.util'

export type GoogleAuthUser = {
  googleId: string
  email: string
  displayName: string
  avatarUrl?: string
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(AuthAttempt.name) private readonly authAttemptModel: Model<AuthAttemptDocument>,
  ) {}

  async findById(id: string) {
    const user = await this.userModel.findById(id).lean()

    if (!user) {
      return null
    }

    return this.toSessionUser(user)
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).lean()
  }

  async upsertGoogleUser(payload: GoogleAuthUser) {
    const existingUser = await this.userModel.findOne({ email: payload.email })

    if (existingUser) {
      existingUser.googleId = payload.googleId
      existingUser.displayName = payload.displayName
      existingUser.avatarUrl = payload.avatarUrl
      await existingUser.save()

      return this.toSessionUser(existingUser.toObject())
    }

    const baseUsername = deriveBaseUsername(payload.email)
    const username = await resolveUsernameCollision(baseUsername, async (candidate) => {
      const user = await this.userModel.exists({ username: candidate })
      return Boolean(user)
    })

    const createdUser = await this.userModel.create({
      googleId: payload.googleId,
      email: payload.email,
      username,
      displayName: payload.displayName,
      avatarUrl: payload.avatarUrl,
      status: 'active',
    })

    return this.toSessionUser(createdUser.toObject())
  }

  async recordAttempt(payload: {
    provider?: string
    emailCandidate?: string
    result: 'started' | 'cancelled' | 'failed' | 'succeeded'
    failureReason?: string
  }) {
    await this.authAttemptModel.create({
      provider: payload.provider ?? 'google',
      emailCandidate: payload.emailCandidate,
      result: payload.result,
      failureReason: payload.failureReason,
    })
  }

  toSessionUser(user: {
    email: string
    username: string
    displayName: string
    avatarUrl?: string
    id?: string
    _id?: { toString(): string }
  }) {
    return {
      id: user.id ?? user._id?.toString() ?? '',
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    }
  }
}
