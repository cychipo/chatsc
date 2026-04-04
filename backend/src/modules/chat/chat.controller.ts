import { Controller, Get } from '@nestjs/common'

@Controller('chat')
export class ChatController {
  @Get('status')
  getStatus() {
    return {
      feature: 'chat',
      status: 'placeholder',
    }
  }
}
