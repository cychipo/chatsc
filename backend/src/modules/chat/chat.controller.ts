import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { AccessTokenAuthGuard } from '../auth/guards/access-token-auth.guard'
import { SessionUser } from '../auth/types/auth-session'
import { ChatService } from './chat.service'
import { CreateConversationDto, AddMemberDto, GetMessagesQueryDto, MarkConversationReadDto, SearchMessagesQueryDto } from './dto/chat.dto'
import { requireActiveParticipant, requireAdminOrOwner } from './utils/participant-access.util'

type AuthenticatedRequest = Request & {
  user?: SessionUser
}

type ChatApiResponse<T> = {
  success: true
  data: T
} | {
  success: false
  error: { code: string; message: string }
}

function wrapSuccess<T>(data: T): ChatApiResponse<T> {
  return { success: true, data }
}

@Controller('chat')
@UseGuards(AccessTokenAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('status')
  getStatus(@Req() request: AuthenticatedRequest) {
    return wrapSuccess({
      feature: 'chat',
      status: 'ready',
      user: request.user,
    })
  }

  @Get('conversations')
  async listConversations(@Req() req: AuthenticatedRequest) {
    const userId = req.user!.id
    const conversations = await this.chatService.listConversationsForUser(userId)
    return wrapSuccess(conversations)
  }

  @Post('conversations')
  @HttpCode(HttpStatus.CREATED)
  async createConversation(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateConversationDto,
  ) {
    const userId = req.user!.id
    if (dto.type === 'direct' && dto.participantIds.length !== 1) {
      throw new BadRequestException({
        error: 'INVALID_PARTICIPANT_COUNT',
        message: 'Direct conversation requires exactly one other participant',
      })
    }
    const conversation = await this.chatService.createConversation(dto.type, userId, dto.participantIds, dto.title)
    return wrapSuccess(conversation)
  }

  @Get('conversations/:conversationId/messages')
  async getMessages(
    @Req() req: AuthenticatedRequest,
    @Param('conversationId') conversationId: string,
    @Query() query: GetMessagesQueryDto,
  ): Promise<ChatApiResponse<Awaited<ReturnType<ChatService['getMessages']>>> > {
    const userId = req.user!.id
    await requireActiveParticipant(this.chatService, conversationId, userId)
    const limit = query.limit ? Math.min(Number(query.limit), 50) : 10
    const messages = await this.chatService.getMessages(conversationId, query.before, limit)
    return wrapSuccess(messages)
  }

  @Get('conversations/:conversationId/messages/search')
  async searchMessages(
    @Req() req: AuthenticatedRequest,
    @Param('conversationId') conversationId: string,
    @Query() query: SearchMessagesQueryDto,
  ): Promise<ChatApiResponse<Awaited<ReturnType<ChatService['searchMessages']>>>> {
    const userId = req.user!.id
    await requireActiveParticipant(this.chatService, conversationId, userId)
    const messages = await this.chatService.searchMessages(conversationId, query.q ?? '')
    return wrapSuccess(messages)
  }

  @Post('conversations/:conversationId/members')
  async addMember(
    @Req() req: AuthenticatedRequest,
    @Param('conversationId') conversationId: string,
    @Body() dto: AddMemberDto,
  ) {
    const actorId = req.user!.id
    await requireActiveParticipant(this.chatService, conversationId, actorId)
    const result = await this.chatService.addMember(conversationId, dto.userId, actorId)
    return wrapSuccess(result)
  }

  @Delete('conversations/:conversationId/members/:userId')
  async removeMember(
    @Req() req: AuthenticatedRequest,
    @Param('conversationId') conversationId: string,
    @Param('userId') userId: string,
  ) {
    const actorId = req.user!.id
    await requireAdminOrOwner(this.chatService, conversationId, actorId)
    await this.chatService.removeMember(conversationId, userId, actorId)
    return wrapSuccess({ removed: true })
  }

  @Post('conversations/:conversationId/leave')
  async leaveConversation(
    @Req() req: AuthenticatedRequest,
    @Param('conversationId') conversationId: string,
  ) {
    const userId = req.user!.id
    await requireActiveParticipant(this.chatService, conversationId, userId)
    await this.chatService.leaveConversation(conversationId, userId)
    return wrapSuccess({ left: true })
  }

  @Delete('conversations/:conversationId')
  async deleteConversation(
    @Req() req: AuthenticatedRequest,
    @Param('conversationId') conversationId: string,
  ) {
    const userId = req.user!.id
    await requireActiveParticipant(this.chatService, conversationId, userId)
    await this.chatService.deleteConversationForUser(conversationId, userId)
    return wrapSuccess({ deleted: true })
  }

  @Post('conversations/:conversationId/read')
  async markConversationRead(
    @Req() req: AuthenticatedRequest,
    @Param('conversationId') conversationId: string,
    @Body() dto: MarkConversationReadDto,
  ) {
    const userId = req.user!.id

    if (dto.conversationId !== conversationId) {
      throw new BadRequestException({
        error: 'CONVERSATION_MISMATCH',
        message: 'Conversation ID in body must match route param',
      })
    }

    await requireActiveParticipant(this.chatService, conversationId, userId)
    const result = await this.chatService.markConversationRead(conversationId, userId)
    return wrapSuccess(result)
  }

  @Get('conversations/:conversationId/events')
  async getMembershipEvents(
    @Req() req: AuthenticatedRequest,
    @Param('conversationId') conversationId: string,
  ) {
    const userId = req.user!.id
    await requireActiveParticipant(this.chatService, conversationId, userId)
    const events = await this.chatService.getMembershipEvents(conversationId)
    return wrapSuccess(events)
  }
}
