import { forwardRef, Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { AuthModule } from '../auth/auth.module'
import { AiModule } from '../ai/ai.module'
import { ChatController } from './chat.controller'
import { ChatEncryptionService } from './chat-encryption.service'
import { ChatGateway } from './chat.gateway'
import { ChatService } from './chat.service'
import { Conversation, ConversationSchema } from './schemas/conversation.schema'
import { ConversationParticipant, ConversationParticipantSchema } from './schemas/conversation-participant.schema'
import { Message, MessageSchema } from './schemas/message.schema'
import { MembershipEvent, MembershipEventSchema } from './schemas/membership-event.schema'
import { ChatAttachment, ChatAttachmentSchema } from './schemas/chat-attachment.schema'
import { ChatAttachmentService } from './chat-attachment.service'

@Module({
  imports: [
    AuthModule,
    forwardRef(() => AiModule),
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: ConversationParticipant.name, schema: ConversationParticipantSchema },
      { name: Message.name, schema: MessageSchema },
      { name: MembershipEvent.name, schema: MembershipEventSchema },
      { name: ChatAttachment.name, schema: ChatAttachmentSchema },
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatEncryptionService, ChatGateway, ChatAttachmentService],
  exports: [ChatService],
})
export class ChatModule {}
