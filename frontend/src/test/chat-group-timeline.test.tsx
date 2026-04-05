import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('../services/chat.service', () => ({
  listConversations: vi.fn().mockResolvedValue([
    { _id: 'group-1', type: 'group', title: 'Team Chat', createdBy: 'user-1' },
  ]),
  getMessages: vi.fn().mockResolvedValue([]),
  getMembershipEvents: vi.fn().mockResolvedValue([
    {
      _id: 'event-1',
      type: 'joined',
      targetUserId: 'user-1',
      occurredAt: new Date().toISOString(),
    },
    {
      _id: 'event-2',
      type: 'added',
      targetUserId: 'user-2',
      actorUserId: 'user-1',
      occurredAt: new Date().toISOString(),
    },
  ]),
}))

vi.mock('../store/auth.store', () => ({
  useAuthStore: vi.fn().mockReturnValue({ user: { id: 'user-1' } }),
}))

describe('Chat group timeline', () => {
  it('renders group conversation in list', async () => {
    const { ChatPage } = await import('../features/chat/chat.page')
    render(<ChatPage />)

    expect(screen.getByTestId('conversation-list')).toBeDefined()
  })

  it('loads membership events for group conversation', async () => {
    const { getMembershipEvents } = await import('../services/chat.service')

    const events = await getMembershipEvents('group-1')

    expect(events).toHaveLength(2)
    expect(events[0].type).toBe('joined')
    expect(events[1].type).toBe('added')
    expect(events[1].actorUserId).toBe('user-1')
  })

  it('membership event contains target user and actor', async () => {
    const { getMembershipEvents } = await import('../services/chat.service')

    const events = await getMembershipEvents('group-1')

    const addedEvent = events.find((e) => e.type === 'added')
    expect(addedEvent).toBeDefined()
    expect(addedEvent?.targetUserId).toBe('user-2')
    expect(addedEvent?.actorUserId).toBe('user-1')
    expect(addedEvent?.occurredAt).toBeDefined()
  })
})
