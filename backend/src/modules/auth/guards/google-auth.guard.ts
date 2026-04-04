import { ExecutionContext, Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ path?: string }>()
    const isCallback = request.path?.includes('/callback')

    if (isCallback) {
      return {
        failureRedirect: '/auth/google/failure',
      }
    }

    return {
      scope: ['email', 'profile'],
    }
  }
}
