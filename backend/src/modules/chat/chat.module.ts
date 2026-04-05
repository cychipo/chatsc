import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { AuthModule } from '../auth/auth.module'
import { ChatController } from './chat.controller'
import { ChatGateway } from './chat.gateway'
import { ChatService } from './chat.service'
import { Conversation, ConversationSchema } from './schemas/conversation.schema'
import { ConversationParticipant, ConversationParticipantSchema } from './schemas/conversation-participant.schema'
import { Message, MessageSchema } from './schemas/message.schema'
import { MembershipEvent, MembershipEventSchema } from './schemas/membership-event.schema'

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: ConversationParticipant.name, schema: ConversationParticipantSchema },
      { name: Message.name, schema: MessageSchema },
      { name: MembershipEvent.name, schema: MembershipEventSchema },
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}
