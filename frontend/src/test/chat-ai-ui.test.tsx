import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SmartReplySuggestions } from '../features/chat/components/smart-reply-suggestions'
import { MessageModeration } from '../features/chat/components/message-moderation'

describe('Chat AI UI', () => {
  it('renders smart reply suggestions', () => {
    render(
      <SmartReplySuggestions
        suggestions={['Xin chào', 'Để mình xem', 'OK nhé']}
        onSelect={() => undefined}
      />,
    )

    expect(screen.getByText('Xin chào')).toBeInTheDocument()
    expect(screen.getByText('Để mình xem')).toBeInTheDocument()
    expect(screen.getByText('OK nhé')).toBeInTheDocument()
  })

  it('renders moderation warning when toxic', () => {
    render(
      <MessageModeration
        moderationResult={{
          messageId: 'msg-1',
          sentiment: 'negative',
          isToxic: true,
          warningMessage: 'Nội dung này có thể gây khó chịu.',
        }}
      />,
    )

    expect(screen.getByText('Nội dung này có thể gây khó chịu.')).toBeInTheDocument()
  })
})
