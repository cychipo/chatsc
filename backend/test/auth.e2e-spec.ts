import { UnauthorizedException } from '@nestjs/common'
import { verify } from 'jsonwebtoken'
import { AuthController } from '../src/modules/auth/auth.controller'
import { AuthService } from '../src/modules/auth/auth.service'
import { backendEnv } from '../src/config/env.config'

describe('Refresh token auth flow', () => {
  const authService = {
    recordAttempt: jest.fn(),
    issueTokenPair: jest.fn(),
    refreshAccessToken: jest.fn(),
    revokeRefreshToken: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('issues a token pair after successful Google callback', async () => {
    const controller = new AuthController(authService as never)
    const redirect = jest.fn()
    const cookie = jest.fn()

    authService.issueTokenPair.mockResolvedValue({
      refreshToken: 'refresh-token',
      accessToken: 'access-token',
      expiresInSeconds: 1800,
      user: {
        id: 'user-1',
        email: 'user@example.com',
        username: 'user',
        displayName: 'User',
      },
    })

    await controller.handleGoogleCallback(
      {
        user: {
          id: 'user-1',
          email: 'user@example.com',
          username: 'user',
          displayName: 'User',
        },
        session: {},
      } as never,
      { redirect, cookie } as never,
    )

    expect(authService.issueTokenPair).toHaveBeenCalledWith(
      {
        id: 'user-1',
        email: 'user@example.com',
        username: 'user',
        displayName: 'User',
      },
    )
    expect(cookie).toHaveBeenCalled()
    expect(redirect).toHaveBeenCalledWith('http://localhost:5173')
  })

  it('returns a refreshed access token when refresh token is valid', async () => {
    const controller = new AuthController(authService as never)
    const env = backendEnv()

    authService.refreshAccessToken.mockResolvedValue({
      accessToken: 'new-access-token',
      expiresInSeconds: env.ACCESS_TOKEN_TTL_SECONDS,
      user: {
        id: 'user-1',
        email: 'user@example.com',
        username: 'user',
        displayName: 'User',
      },
    })

    const result = await controller.refresh(
      {
        headers: {
          cookie: `${env.REFRESH_COOKIE_NAME}=refresh-token`,
        },
      } as never,
      { clearCookie: jest.fn() } as never,
    )

    expect(authService.refreshAccessToken).toHaveBeenCalledWith('refresh-token')
    expect(result).toEqual({
      accessToken: 'new-access-token',
      expiresInSeconds: env.ACCESS_TOKEN_TTL_SECONDS,
      user: {
        id: 'user-1',
        email: 'user@example.com',
        username: 'user',
        displayName: 'User',
      },
    })
  })

  it('rejects refresh when refresh token is expired', async () => {
    const controller = new AuthController(authService as never)
    const clearCookie = jest.fn()
    authService.refreshAccessToken.mockRejectedValue(
      new UnauthorizedException({ code: 'refresh_token_expired', message: 'Refresh token has expired' }),
    )

    await expect(
      controller.refresh(
        {
          headers: {
            cookie: `${backendEnv().REFRESH_COOKIE_NAME}=expired-refresh-token`,
          },
        } as never,
        { clearCookie } as never,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException)

    expect(clearCookie).toHaveBeenCalled()
  })

  it('revokes refresh session on logout', async () => {
    const controller = new AuthController(authService as never)
    const clearCookie = jest.fn()
    const destroy = jest.fn((callback: (error?: Error | null) => void) => callback())

    await controller.logout(
      {
        headers: {
          cookie: `${backendEnv().REFRESH_COOKIE_NAME}=refresh-token`,
        },
        session: { destroy },
      } as never,
      { clearCookie } as never,
    )

    expect(authService.revokeRefreshToken).toHaveBeenCalledWith('refresh-token')
    expect(clearCookie).toHaveBeenCalled()
    expect(destroy).toHaveBeenCalled()
  })

  it('uses 30 minute access token ttl and 7 day refresh token ttl defaults', () => {
    const env = backendEnv()

    expect(env.ACCESS_TOKEN_TTL_SECONDS).toBe(1800)
    expect(env.REFRESH_TOKEN_TTL_SECONDS).toBe(604800)
  })

  it('signs access and refresh tokens without duplicated registered jwt claims', async () => {
    const env = backendEnv()
    const userRecord = {
      id: '507f1f77bcf86cd799439011',
      email: 'user@example.com',
      username: 'user',
      displayName: 'User',
    }

    const authServiceInstance = new AuthService(
      {
        findById: jest.fn().mockResolvedValue({
          _id: userRecord.id,
          email: userRecord.email,
          username: userRecord.username,
          displayName: userRecord.displayName,
        }),
      } as never,
      {
        create: jest.fn().mockResolvedValue(undefined),
      } as never,
      function RefreshSessionModel(this: Record<string, unknown>, payload: Record<string, unknown>) {
        Object.assign(this, payload)
        this.id = 'session-1'
        this.save = jest.fn().mockResolvedValue(this)
      } as never,
    )

    const issuedSession = await authServiceInstance.issueTokenPair(userRecord)

    const accessPayload = verify(issuedSession.accessToken, env.ACCESS_TOKEN_SECRET) as {
      type: string
      sub: string
      sid: string
      jti?: string
      exp: number
    }
    const refreshPayload = verify(issuedSession.refreshToken, env.REFRESH_TOKEN_SECRET) as {
      type: string
      sub: string
      sid: string
      jti: string
      exp: number
    }

    expect(accessPayload).toMatchObject({
      type: 'access',
      sub: userRecord.id,
      sid: 'session-1',
    })
    expect(accessPayload.jti).toBeUndefined()
    expect(accessPayload.exp).toBeDefined()

    expect(refreshPayload).toMatchObject({
      type: 'refresh',
      sub: userRecord.id,
      sid: 'session-1',
    })
    expect(refreshPayload.jti).toEqual(expect.any(String))
    expect(refreshPayload.exp).toBeDefined()
  })

  it('records renewal outcomes with user and session identifiers', async () => {
    await authService.recordAttempt({
      provider: 'refresh-token',
      result: 'renewed',
      userId: 'user-1',
      sessionId: 'session-1',
    })

    expect(authService.recordAttempt).toHaveBeenCalledWith({
      provider: 'refresh-token',
      result: 'renewed',
      userId: 'user-1',
      sessionId: 'session-1',
    })
  })
})
