import { render, screen } from '@testing-library/react'
import { beforeEach, vi } from 'vitest'
import App from '../App'
import { AppProviders } from '../app/providers'
import * as authService from '../services/auth.service'

vi.mock('../services/auth.service', async () => {
  const actual = await vi.importActual<typeof import('../services/auth.service')>('../services/auth.service')

  return {
    ...actual,
    getCurrentUser: vi.fn(),
    refreshSession: vi.fn(),
  }
})

describe('Authenticated profile summary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
  })

  it('shows display name, email, and username in the protected area', async () => {
    vi.mocked(authService.refreshSession).mockResolvedValue({
      accessToken: 'access-token',
      expiresInSeconds: 1800,
      user: {
        id: 'user-42',
        email: 'abc.123@gmail.com',
        username: 'abc.123',
        displayName: 'ABC User',
        avatarUrl: 'https://example.com/avatar.png',
      },
    })
    vi.mocked(authService.getCurrentUser).mockResolvedValue({
      id: 'user-42',
      email: 'abc.123@gmail.com',
      username: 'abc.123',
      displayName: 'ABC User',
      avatarUrl: 'https://example.com/avatar.png',
    })

    render(
      <AppProviders>
        <App />
      </AppProviders>,
    )

    expect(await screen.findByText('ABC User')).toBeInTheDocument()
    expect(screen.getByText('abc.123@gmail.com')).toBeInTheDocument()
    expect(screen.getByText('@abc.123')).toBeInTheDocument()
  })
})
