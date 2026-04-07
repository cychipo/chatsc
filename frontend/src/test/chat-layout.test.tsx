import { act, render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('../services/chat.service', () => ({
  listConversations: vi.fn().mockResolvedValue([]),
  getMessages: vi.fn().mockResolvedValue([]),
  getMembershipEvents: vi.fn().mockResolvedValue([]),
}))

vi.mock('../store/auth.store', () => ({
  useAuthStore: vi.fn().mockReturnValue({ user: { id: 'user-1' } }),
}))

describe('Chat layout', () => {
  it('renders conversation list panel', async () => {
    const { ChatPage } = await import('../features/chat/chat.page')
    await act(async () => {
      render(<ChatPage />)
    })

    expect(screen.getByTestId('conversation-list')).toBeDefined()
  })

  it('renders message thread panel', async () => {
    const { ChatPage } = await import('../features/chat/chat.page')
    await act(async () => {
      render(<ChatPage />)
    })

    expect(screen.getByTestId('message-thread')).toBeDefined()
  })

  it('renders chat composer panel', async () => {
    const { ChatPage } = await import('../features/chat/chat.page')
    await act(async () => {
      render(<ChatPage />)
    })

    expect(screen.getByTestId('chat-composer')).toBeDefined()
  })

  it('has three distinct layout regions', async () => {
    const { ChatPage } = await import('../features/chat/chat.page')
    await act(async () => {
      render(<ChatPage />)
    })

    const conversationList = screen.getByTestId('conversation-list')
    const messageThread = screen.getByTestId('message-thread')
    const chatComposer = screen.getByTestId('chat-composer')

    expect(conversationList).toBeDefined()
    expect(messageThread).toBeDefined()
    expect(chatComposer).toBeDefined()
  })
})
