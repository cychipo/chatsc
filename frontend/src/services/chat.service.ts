import { http } from './http'
import { AuthUser } from '../types/auth'
import {
  Conversation,
  Message,
  MembershipEvent,
  CreateConversationRequest,
  AddMemberRequest,
  GetMessagesQuery,
  MarkConversationReadResponse,
  MessageSearchResult,
  RealtimeMessage,
} from '../types/chat'

type ApiResponse<T> = {
  success: true
  data: T
}

function unwrap<T>(response: ApiResponse<T>) {
  return response.data
}

export async function getChatStatus() {
  const { data } = await http.get<ApiResponse<{ feature: 'chat'; status: string; user?: AuthUser }>>('/chat/status')
  return unwrap(data)
}

export async function listConversations() {
  const { data } = await http.get<ApiResponse<Conversation[]>>('/chat/conversations')
  return unwrap(data)
}

export async function createConversation(req: CreateConversationRequest) {
  const { data } = await http.post<ApiResponse<Conversation>>('/chat/conversations', req)
  return unwrap(data)
}

export async function getMessages(conversationId: string, query?: GetMessagesQuery) {
  const params: Record<string, string | number> = {}
  if (query?.before) params.before = query.before
  if (query?.limit) params.limit = query.limit
  const { data } = await http.get<ApiResponse<Message[]>>(`/chat/conversations/${conversationId}/messages`, { params })
  return unwrap(data)
}

export function mapRealtimeMessage(message: RealtimeMessage): Message {
  return {
    _id: message.messageId,
    conversationId: message.conversationId,
    senderId: message.senderId,
    senderDisplayName: message.senderDisplayName,
    senderAvatarUrl: message.senderAvatarUrl,
    content: message.content,
    sentAt: message.sentAt,
    deliveryStatus: 'sent',
    seenState: message.seenState,
    attachment: message.attachment,
    isTailOfSenderGroup: message.isTailOfSenderGroup,
    decodeErrorCode: message.decodeErrorCode,
    displayState: message.displayState,
  }
}

export async function addMember(conversationId: string, req: AddMemberRequest) {
  const { data } = await http.post<ApiResponse<{ alreadyMember: boolean }>>(
    `/chat/conversations/${conversationId}/members`,
    req,
  )
  return unwrap(data)
}

export async function removeMember(conversationId: string, userId: string) {
  const { data } = await http.delete<ApiResponse<{ removed: boolean }>>(
    `/chat/conversations/${conversationId}/members/${userId}`,
  )
  return unwrap(data)
}

export async function leaveConversation(conversationId: string) {
  const { data } = await http.post<ApiResponse<{ left: boolean }>>(
    `/chat/conversations/${conversationId}/leave`,
  )
  return unwrap(data)
}

export async function deleteConversation(conversationId: string) {
  const { data } = await http.delete<ApiResponse<{ deleted: boolean }>>(
    `/chat/conversations/${conversationId}`,
  )
  return unwrap(data)
}

export async function markConversationRead(conversationId: string) {
  const { data } = await http.post<ApiResponse<MarkConversationReadResponse>>(
    `/chat/conversations/${conversationId}/read`,
    { conversationId },
  )
  return unwrap(data)
}

export async function searchMessages(conversationId: string, query: string) {
  const { data } = await http.get<ApiResponse<MessageSearchResult[]>>(
    `/chat/conversations/${conversationId}/messages/search`,
    {
      params: { q: query },
    },
  )
  return unwrap(data)
}

export async function getMembershipEvents(conversationId: string) {
  const { data } = await http.get<ApiResponse<MembershipEvent[]>>(
    `/chat/conversations/${conversationId}/events`,
  )
  return unwrap(data)
}
