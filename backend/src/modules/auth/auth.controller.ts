import { Controller, Get, Post, Query, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common'
import { Request, Response } from 'express'
import { backendEnv } from '../../config/env.config'
import { AuthService } from './auth.service'
import { GoogleAuthGuard } from './guards/google-auth.guard'
import { SessionAuthGuard } from './guards/session-auth.guard'
import { AccessTokenAuthGuard } from './guards/access-token-auth.guard'
import { SessionUser } from './types/auth-session'

type AuthenticatedRequest = Request & {
  user?: SessionUser
  session?: {
    user?: SessionUser
    destroy?: (callback: (error?: Error | null) => void) => void
  }
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async startGoogleLogin() {
    await this.authService.recordAttempt({ result: 'started' })
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async handleGoogleCallback(@Req() request: AuthenticatedRequest, @Res() response: Response) {
    const oauthUser = request.user

    if (!oauthUser) {
      await this.authService.recordAttempt({ result: 'failed', failureReason: 'missing-oauth-user' })
      return response.redirect(this.buildFrontendRedirect('oauth_failed'))
    }

    if (request.session) {
      request.session.user = oauthUser
    }

    const issuedSession = await this.authService.issueTokenPair(oauthUser)

    this.setRefreshCookie(response, issuedSession.refreshToken)
    await this.authService.recordAttempt({
      result: 'succeeded',
      emailCandidate: oauthUser.email,
      userId: oauthUser.id,
    })

    return response.redirect(this.buildFrontendRedirect())
  }

  @Get('google/failure')
  async handleGoogleFailure(@Res() response: Response) {
    await this.authService.recordAttempt({ result: 'cancelled', failureReason: 'google-auth-cancelled' })
    return response.redirect(this.buildFrontendRedirect('google_auth_cancelled'))
  }

  @Get('me')
  @UseGuards(AccessTokenAuthGuard)
  getCurrentUser(@Req() request: AuthenticatedRequest) {
    return {
      user: request.user,
    }
  }

  @Get('users/search')
  @UseGuards(AccessTokenAuthGuard)
  async searchUsers(@Req() request: AuthenticatedRequest, @Query('q') query: string) {
    return {
      success: true,
      data: await this.authService.searchUsers(query ?? '', request.user!.id),
    }
  }

  @Post('refresh')
  async refresh(@Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    const refreshToken = this.getRefreshTokenFromRequest(request)

    if (!refreshToken) {
      throw new UnauthorizedException({ code: 'refresh_token_missing', message: 'Refresh token is required' })
    }

    try {
      return await this.authService.refreshAccessToken(refreshToken)
    } catch (error) {
      this.clearRefreshCookie(response)
      throw error
    }
  }

  @Post('logout')
  async logout(@Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    const refreshToken = this.getRefreshTokenFromRequest(request)

    if (refreshToken) {
      await this.authService.revokeRefreshToken(refreshToken)
    }

    this.clearRefreshCookie(response)

    if (request.session?.destroy) {
      await new Promise<void>((resolve, reject) => {
        request.session?.destroy?.((error?: Error | null) => {
          if (error) {
            reject(error)
            return
          }

          resolve()
        })
      })
    }

    return {
      success: true,
    }
  }

  @Get('status')
  getStatus() {
    return {
      feature: 'auth',
      status: 'ready',
    }
  }

  private buildFrontendRedirect(error?: string) {
    const frontendUrl = process.env.FRONTEND_APP_URL ?? 'http://localhost:5173'

    if (!error) {
      return frontendUrl
    }

    const url = new URL(frontendUrl)
    url.searchParams.set('authError', error)
    return url.toString()
  }

  private getRefreshTokenFromRequest(request: AuthenticatedRequest) {
    const env = backendEnv()
    const cookieHeader = request.headers.cookie

    if (!cookieHeader) {
      return null
    }

    const cookieParts = cookieHeader.split(';').map((part) => part.trim())
    const cookieValue = cookieParts.find((part) => part.startsWith(`${env.REFRESH_COOKIE_NAME}=`))

    if (!cookieValue) {
      return null
    }

    return decodeURIComponent(cookieValue.slice(env.REFRESH_COOKIE_NAME.length + 1))
  }

  private setRefreshCookie(response: Response, refreshToken: string) {
    const env = backendEnv()

    response.cookie(env.REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: env.REFRESH_TOKEN_TTL_SECONDS * 1000,
      path: '/',
    })
  }

  private clearRefreshCookie(response: Response) {
    const env = backendEnv()
    response.clearCookie(env.REFRESH_COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
    })
  }
}
