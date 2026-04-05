import { Injectable, UnauthorizedException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { JwtPayload, SignOptions, TokenExpiredError, verify, sign } from 'jsonwebtoken'
import { Model, Types } from 'mongoose'
import { createHash, randomUUID } from 'crypto'
import { backendEnv } from '../../config/env.config'
import { AuthAttempt, AuthAttemptDocument } from './schemas/auth-attempt.schema'
import { RefreshSession, RefreshSessionDocument } from './schemas/refresh-session.schema'
import { User, UserDocument } from './schemas/user.schema'
import { SessionUser } from './types/auth-session'
import { AccessTokenPayload, RefreshSessionResponse } from './types/token-payload'
import { deriveBaseUsername, resolveUsernameCollision } from './utils/username.util'

export type GoogleAuthUser = {
  googleId: string
  email: string
  displayName: string
  avatarUrl?: string
}

type RefreshTokenPayload = {
  type: 'refresh'
  sub: string
  sid: string
  jti: string
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(AuthAttempt.name) private readonly authAttemptModel: Model<AuthAttemptDocument>,
    @InjectModel(RefreshSession.name) private readonly refreshSessionModel: Model<RefreshSessionDocument>,
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

  async searchUsers(query: string, currentUserId: string) {
    const trimmedQuery = query.trim()

    if (trimmedQuery.length < 2) {
      return []
    }

    const escapedQuery = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const searchRegex = new RegExp(escapedQuery, 'i')

    const users = await this.userModel
      .find({
        _id: { $ne: new Types.ObjectId(currentUserId) },
        $or: [
          { email: searchRegex },
          { username: searchRegex },
          { displayName: searchRegex },
        ],
      })
      .sort({ username: 1 })
      .limit(10)
      .lean()

    return users.map((user) => this.toSessionUser(user))
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

  async issueTokenPair(user: SessionUser, createdBy = 'google-login'): Promise<RefreshSessionResponse & { refreshToken: string }> {
    const env = backendEnv()
    const issuedAt = new Date()
    const expiresAt = new Date(issuedAt.getTime() + env.REFRESH_TOKEN_TTL_SECONDS * 1000)
    const refreshSession = new this.refreshSessionModel({
      userId: new Types.ObjectId(user.id),
      tokenHash: '',
      issuedAt,
      expiresAt,
      status: 'active',
      createdBy,
    })

    const refreshToken = this.signRefreshToken({
      type: 'refresh',
      sub: user.id,
      sid: refreshSession.id,
      jti: randomUUID(),
    })

    refreshSession.tokenHash = this.hashToken(refreshToken)
    await refreshSession.save()

    await this.recordAttempt({
      provider: 'refresh-token',
      result: 'issued',
      userId: user.id,
      sessionId: refreshSession.id,
    })

    return {
      refreshToken,
      ...this.buildRefreshSessionResponse(user, refreshSession.id),
    }
  }

  async refreshAccessToken(refreshToken: string) {
    const payload = this.verifyRefreshToken(refreshToken)
    const refreshSession = await this.refreshSessionModel.findById(payload.sid)

    if (!refreshSession) {
      await this.recordAttempt({
        provider: 'refresh-token',
        result: 'failed',
        failureReason: 'refresh-session-missing',
        userId: payload.sub,
        sessionId: payload.sid,
      })
      throw new UnauthorizedException({ code: 'refresh_token_invalid', message: 'Refresh token is invalid' })
    }

    const now = new Date()

    if (refreshSession.tokenHash !== this.hashToken(refreshToken)) {
      await this.recordAttempt({
        provider: 'refresh-token',
        result: 'failed',
        failureReason: 'refresh-token-mismatch',
        userId: payload.sub,
        sessionId: payload.sid,
      })
      throw new UnauthorizedException({ code: 'refresh_token_invalid', message: 'Refresh token is invalid' })
    }

    if (refreshSession.revokedAt || refreshSession.status === 'revoked') {
      await this.recordAttempt({
        provider: 'refresh-token',
        result: 'failed',
        failureReason: 'refresh-token-revoked',
        userId: payload.sub,
        sessionId: payload.sid,
      })
      throw new UnauthorizedException({ code: 'refresh_token_revoked', message: 'Refresh token has been revoked' })
    }

    if (refreshSession.expiresAt.getTime() <= now.getTime()) {
      refreshSession.status = 'expired'
      await refreshSession.save()
      await this.recordAttempt({
        provider: 'refresh-token',
        result: 'failed',
        failureReason: 'refresh-token-expired',
        userId: payload.sub,
        sessionId: payload.sid,
      })
      throw new UnauthorizedException({ code: 'refresh_token_expired', message: 'Refresh token has expired' })
    }

    const user = await this.findById(payload.sub)

    if (!user) {
      await this.recordAttempt({
        provider: 'refresh-token',
        result: 'failed',
        failureReason: 'refresh-user-missing',
        userId: payload.sub,
        sessionId: payload.sid,
      })
      throw new UnauthorizedException({ code: 'refresh_user_missing', message: 'User is no longer available' })
    }

    refreshSession.lastUsedAt = now
    await refreshSession.save()

    await this.recordAttempt({
      provider: 'refresh-token',
      result: 'renewed',
      userId: user.id,
      sessionId: refreshSession.id,
    })

    return this.buildRefreshSessionResponse(user, refreshSession.id)
  }

  async revokeRefreshToken(refreshToken: string) {
    let payload: RefreshTokenPayload

    try {
      payload = this.verifyRefreshToken(refreshToken)
    } catch {
      return
    }

    const refreshSession = await this.refreshSessionModel.findById(payload.sid)

    if (!refreshSession) {
      return
    }

    refreshSession.revokedAt = new Date()
    refreshSession.status = 'revoked'
    await refreshSession.save()

    await this.recordAttempt({
      provider: 'refresh-token',
      result: 'revoked',
      userId: payload.sub,
      sessionId: payload.sid,
    })
  }

  async authenticateAccessToken(token: string) {
    const payload = this.verifyAccessToken(token)

    if (!payload) {
      return null
    }

    const refreshSession = await this.refreshSessionModel.findById(payload.sid).lean()

    if (!refreshSession || refreshSession.status !== 'active' || refreshSession.revokedAt) {
      return null
    }

    if (new Date(refreshSession.expiresAt).getTime() <= Date.now()) {
      return null
    }

    return this.findById(payload.sub)
  }

  verifyAccessToken(token: string) {
    const env = backendEnv()

    try {
      return verify(token, env.ACCESS_TOKEN_SECRET) as AccessTokenPayload & JwtPayload
    } catch {
      return null
    }
  }

  verifyRefreshToken(token: string) {
    const env = backendEnv()

    try {
      return verify(token, env.REFRESH_TOKEN_SECRET) as RefreshTokenPayload & JwtPayload
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException({ code: 'refresh_token_expired', message: 'Refresh token has expired' })
      }

      throw new UnauthorizedException({ code: 'refresh_token_invalid', message: 'Refresh token is invalid' })
    }
  }

  async recordAttempt(payload: {
    provider?: string
    emailCandidate?: string
    result: string
    failureReason?: string
    userId?: string
    sessionId?: string
  }) {
    await this.authAttemptModel.create({
      provider: payload.provider ?? 'google',
      emailCandidate: payload.emailCandidate,
      result: payload.result,
      failureReason: payload.failureReason,
      userId: payload.userId,
      sessionId: payload.sessionId,
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

  private buildRefreshSessionResponse(user: SessionUser, sessionId: string): RefreshSessionResponse {
    const env = backendEnv()

    return {
      accessToken: this.signAccessToken({
        type: 'access',
        sub: user.id,
        sid: sessionId,
      }),
      user,
      expiresInSeconds: env.ACCESS_TOKEN_TTL_SECONDS,
    }
  }

  private signAccessToken(payload: AccessTokenPayload) {
    const env = backendEnv()
    return sign(payload, env.ACCESS_TOKEN_SECRET, {
      algorithm: 'HS256',
      expiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
    } satisfies SignOptions)
  }

  private signRefreshToken(payload: RefreshTokenPayload) {
    const env = backendEnv()
    return sign(payload, env.REFRESH_TOKEN_SECRET, {
      algorithm: 'HS256',
      expiresIn: env.REFRESH_TOKEN_TTL_SECONDS,
    } satisfies SignOptions)
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex')
  }
}
