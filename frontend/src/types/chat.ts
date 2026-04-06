export type ChatStatus = {
  feature: 'chat'
  status: string
}

export type ChatConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected'

export type ChatSocketError = {
  code: string
  message: string
  conversationId?: string
}

export type ConversationType = 'direct' | 'group'

export type ConversationPeer = {
  id: string
  username: string
  displayName: string
  email?: string
  avatarUrl?: string
}

export type Conversation = {
  _id: string
  type: ConversationType
  title?: string
  createdBy: string
  lastMessageAt?: string
  createdAt: string
  updatedAt: string
  displayTitle?: string
  displayAvatarUrl?: string
  lastMessagePreview?: string
  unreadCount?: number
  hasUnread?: boolean
  directPeer?: ConversationPeer
}

export type ParticipantRole = 'member' | 'admin' | 'owner'
export type ParticipantStatus = 'active' | 'left' | 'removed'

export type ConversationParticipant = {
  _id: string
  conversationId: string
  userId: string
  role: ParticipantRole
  status: ParticipantStatus
  addedBy?: string
  joinedAt: string
  leftAt?: string
}

export type DeliveryStatus = 'sent' | 'failed'
export type MessageDisplayState = 'ready' | 'decode_failed'

export type SeenState = 'sent' | 'seen'

export type Message = {
  _id: string
  conversationId: string
  senderId: string
  content: string
  sentAt: string
  deliveryStatus: DeliveryStatus
  seenState?: SeenState
  isTailOfSenderGroup?: boolean
  decodeErrorCode?: string
  displayState?: MessageDisplayState
}

export type RealtimeMessage = {
  messageId: string
  conversationId: string
  senderId: string
  content: string
  sentAt: string
  seenState?: SeenState
  isTailOfSenderGroup?: boolean
  decodeErrorCode?: string
  displayState?: MessageDisplayState
}

export type ConversationPreviewUpdate = {
  conversationId: string
  lastMessagePreview: string
  lastMessageAt: string
  unreadCount?: number
  hasUnread?: boolean
}

export type MembershipEventType = 'added' | 'joined' | 'left' | 'removed'

export type MembershipEvent = {
  _id: string
  conversationId: string
  type: MembershipEventType
  targetUserId: string
  actorUserId?: string
  occurredAt: string
  metadata?: Record<string, unknown>
}

export type MarkConversationReadResponse = {
  conversationId: string
  unreadCount: number
  lastReadMessageId?: string
}

export type TypingPresenceUpdate = {
  conversationId: string
  userId: string
  isTyping: boolean
  expiresAt?: string
}

export type CreateConversationRequest = {
  type: ConversationType
  title?: string
  participantIds: string[]
}

export type AddMemberRequest = {
  userId: string
}

export type GetMessagesQuery = {
  before?: string
  limit?: number
}
