import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common'
import { Request, Response } from 'express'
import { AuthService } from './auth.service'
import { GoogleAuthGuard } from './guards/google-auth.guard'
import { SessionAuthGuard } from './guards/session-auth.guard'
import { SessionUser } from './types/auth-session'

type AuthenticatedRequest = Request & {
  user?: SessionUser
  session: {
    user?: SessionUser
    destroy: (callback: (error?: Error | null) => void) => void
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

    request.session.user = oauthUser
    await this.authService.recordAttempt({
      result: 'succeeded',
      emailCandidate: oauthUser.email,
    })

    return response.redirect(this.buildFrontendRedirect())
  }

  @Get('google/failure')
  async handleGoogleFailure(@Res() response: Response) {
    await this.authService.recordAttempt({ result: 'cancelled', failureReason: 'google-auth-cancelled' })
    return response.redirect(this.buildFrontendRedirect('google_auth_cancelled'))
  }

  @Get('me')
  @UseGuards(SessionAuthGuard)
  getCurrentUser(@Req() request: AuthenticatedRequest) {
    return {
      user: request.session.user,
    }
  }

  @Post('logout')
  async logout(@Req() request: AuthenticatedRequest) {
    await new Promise<void>((resolve, reject) => {
      request.session.destroy((error?: Error | null) => {
        if (error) {
          reject(error)
          return
        }

        resolve()
      })
    })

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
}
