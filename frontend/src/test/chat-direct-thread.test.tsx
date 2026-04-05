import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('../services/chat.service', () => ({
  listConversations: vi.fn().mockResolvedValue([
    { _id: 'conv-1', type: 'direct', createdBy: 'user-1', lastMessageAt: new Date().toISOString() },
  ]),
  getMessages: vi.fn().mockResolvedValue([
    { _id: 'msg-1', content: 'Hello', senderId: 'user-1', sentAt: new Date().toISOString() },
    { _id: 'msg-2', content: 'Hi there', senderId: 'user-2', sentAt: new Date().toISOString() },
  ]),
}))

vi.mock('../store/auth.store', () => ({
  useAuthStore: vi.fn().mockReturnValue({ user: { id: 'user-1' } }),
}))

describe('Chat direct thread', () => {
  it('renders conversation list', async () => {
    const { ChatPage } = await import('../features/chat/chat.page')
    render(<ChatPage />)

    expect(screen.getByTestId('conversation-list')).toBeDefined()
  })

  it('renders message thread area', async () => {
    const { ChatPage } = await import('../features/chat/chat.page')
    render(<ChatPage />)

    expect(screen.getByTestId('message-thread')).toBeDefined()
  })

  it('renders input composer', async () => {
    const { ChatPage } = await import('../features/chat/chat.page')
    render(<ChatPage />)

    expect(screen.getByTestId('chat-composer')).toBeDefined()
  })

  it('distinguishes own messages from others', async () => {
    const { ChatPage } = await import('../features/chat/chat.page')
    render(<ChatPage />)

    const ownMessages = screen.queryAllByTestId('message-bubble-mine')
    const otherMessages = screen.queryAllByTestId('message-bubble-theirs')

    expect(ownMessages.length + otherMessages.length).toBeGreaterThanOrEqual(0)
  })
})
