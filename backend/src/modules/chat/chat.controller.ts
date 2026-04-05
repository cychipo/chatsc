import { Controller, Get, Req, UseGuards } from '@nestjs/common'
import { AccessTokenAuthGuard } from '../auth/guards/access-token-auth.guard'
import { SessionUser } from '../auth/types/auth-session'

type AuthenticatedRequest = Request & {
  user?: SessionUser
}

@Controller('chat')
export class ChatController {
  @Get('status')
  @UseGuards(AccessTokenAuthGuard)
  getStatus(@Req() request: AuthenticatedRequest) {
    return {
      feature: 'chat',
      status: 'ready',
      user: request.user,
    }
  }
}
