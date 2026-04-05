import { Socket } from 'socket.io'

const JOINED_CONVERSATIONS_KEY = 'joinedConversationIds'

type ChatSocketData = {
  joinedConversationIds?: string[]
}

export function getConversationRoom(conversationId: string) {
  return `conversation:${conversationId}`
}

export function getUserRoom(userId: string) {
  return `user:${userId}`
}

export function getJoinedConversationIds(client: Socket) {
  const data = client.data as ChatSocketData
  return data.joinedConversationIds ?? []
}

export function markConversationJoined(client: Socket, conversationId: string) {
  const current = getJoinedConversationIds(client)

  if (current.includes(conversationId)) {
    return current
  }

  const next = [...current, conversationId]
  ;(client.data as ChatSocketData).joinedConversationIds = next
  return next
}

export function markConversationLeft(client: Socket, conversationId: string) {
  const next = getJoinedConversationIds(client).filter((joinedId) => joinedId !== conversationId)
  ;(client.data as ChatSocketData).joinedConversationIds = next
  return next
}
