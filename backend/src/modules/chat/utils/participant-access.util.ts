import { ForbiddenException } from '@nestjs/common'
import { ChatService } from '../chat.service'

export async function requireActiveParticipant(
  chatService: ChatService,
  conversationId: string,
  userId: string,
) {
  const participant = await chatService.getActiveParticipant(conversationId, userId)
  if (!participant) {
    throw new ForbiddenException('You are not an active participant of this conversation')
  }
  return participant
}

export async function requireAdminOrOwner(
  chatService: ChatService,
  conversationId: string,
  userId: string,
) {
  const role = await chatService.getParticipantRole(conversationId, userId)
  if (!role || (role !== 'admin' && role !== 'owner')) {
    throw new ForbiddenException('You do not have permission to perform this action')
  }
  return role
}
