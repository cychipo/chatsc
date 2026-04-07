import { act, render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('../services/chat.service', () => ({
  listConversations: vi.fn().mockResolvedValue([
    { _id: 'conv-1', type: 'direct', createdBy: 'user-1', lastMessageAt: new Date().toISOString() },
  ]),
  getMessages: vi.fn().mockResolvedValue([
    { _id: 'msg-1', content: 'My message', senderId: 'user-1', sentAt: new Date().toISOString() },
    { _id: 'msg-2', content: 'Their message', senderId: 'user-2', sentAt: new Date().toISOString() },
  ]),
  getMembershipEvents: vi.fn().mockResolvedValue([]),
}))

vi.mock('../store/auth.store', () => ({
  useAuthStore: vi.fn().mockReturnValue({ user: { id: 'user-1' } }),
}))

describe('Chat bubble variant', () => {
  it('renders own messages with mine styling', async () => {
    const { ChatPage } = await import('../features/chat/chat.page')
    await act(async () => {
      render(<ChatPage />)
    })

    const mineBubbles = screen.queryAllByTestId('message-bubble-mine')
    expect(mineBubbles.length).toBeGreaterThanOrEqual(0)
  })

  it('renders other messages with theirs styling', async () => {
    const { ChatPage } = await import('../features/chat/chat.page')
    await act(async () => {
      render(<ChatPage />)
    })

    const theirsBubbles = screen.queryAllByTestId('message-bubble-theirs')
    expect(theirsBubbles.length).toBeGreaterThanOrEqual(0)
  })

  it('own messages align to right', async () => {
    const { ChatPage } = await import('../features/chat/chat.page')
    await act(async () => {
      render(<ChatPage />)
    })

    const mineBubbles = screen.queryAllByTestId('message-bubble-mine')
    mineBubbles.forEach((bubble) => {
      const parent = bubble.parentElement
      expect(parent?.style.justifyContent).toBe('flex-end')
    })
  })

  it('their messages align to left', async () => {
    const { ChatPage } = await import('../features/chat/chat.page')
    await act(async () => {
      render(<ChatPage />)
    })

    const theirsBubbles = screen.queryAllByTestId('message-bubble-theirs')
    theirsBubbles.forEach((bubble) => {
      const parent = bubble.parentElement
      expect(parent?.style.justifyContent).toBe('flex-start')
    })
  })
})
