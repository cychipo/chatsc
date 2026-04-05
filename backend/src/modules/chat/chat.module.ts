import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { ChatController } from './chat.controller'

@Module({
  imports: [AuthModule],
  controllers: [ChatController],
})
export class ChatModule {}
