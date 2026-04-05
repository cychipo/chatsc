import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { AuthService } from '../auth.service'
import { SessionUser } from '../types/auth-session'

type AuthenticatedRequest = Request & {
  headers: {
    authorization?: string
  }
  user?: SessionUser
}

@Injectable()
export class AccessTokenAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const authorization = request.headers.authorization

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException({ code: 'access_token_missing', message: 'Access token is required' })
    }

    const token = authorization.slice('Bearer '.length).trim()

    if (!token) {
      throw new UnauthorizedException({ code: 'access_token_missing', message: 'Access token is required' })
    }

    const user = await this.authService.authenticateAccessToken(token)

    if (!user) {
      throw new UnauthorizedException({ code: 'access_token_expired', message: 'Access token is expired or invalid' })
    }

    request.user = user
    return true
  }
}
