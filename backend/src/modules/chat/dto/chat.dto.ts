export class CreateConversationDto {
  type!: 'direct' | 'group'

  title?: string

  participantIds!: string[]
}

export class AddMemberDto {
  userId!: string
}

export class GetMessagesQueryDto {
  before?: string

  limit?: number
}

export class MarkConversationReadDto {
  conversationId!: string
}
