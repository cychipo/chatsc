import { forwardRef, Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { AuthModule } from '../auth/auth.module'
import { ChatModule } from '../chat/chat.module'
import { AiConfigService } from './ai-config.service'
import { AiService } from './ai.service'
import { AiGateway } from './ai.gateway'
import { AiChatbotService } from './ai-chatbot.service'
import { AiSuggestionsService } from './ai-suggestions.service'
import { AiModerationService } from './ai-moderation.service'
import { AiUserSettings, AiUserSettingsSchema } from './schemas/ai-user-settings.schema'

@Module({
  imports: [
    AuthModule,
    forwardRef(() => ChatModule),
    MongooseModule.forFeature([{ name: AiUserSettings.name, schema: AiUserSettingsSchema }]),
  ],
  providers: [AiConfigService, AiService, AiChatbotService, AiSuggestionsService, AiModerationService, AiGateway],
  exports: [AiConfigService, AiService, AiChatbotService, AiSuggestionsService, AiModerationService, MongooseModule],
})
export class AiModule {}
