import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import App from '../App'
import { AppProviders } from '../app/providers'
import * as authService from '../services/auth.service'

vi.mock('../services/auth.service', async () => {
  const actual = await vi.importActual<typeof import('../services/auth.service')>('../services/auth.service')

  return {
    ...actual,
    getCurrentUser: vi.fn(),
    logout: vi.fn(),
  }
})

describe('OAuth session flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.history.replaceState({}, document.title, '/')
  })

  it('hydrates authenticated session on app load', async () => {
    vi.mocked(authService.getCurrentUser).mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      username: 'user',
      displayName: 'User',
    })

    render(
      <AppProviders>
        <App />
      </AppProviders>,
    )

    expect(await screen.findByText('Welcome back')).toBeInTheDocument()
  })

  it('returns to auth page after logout', async () => {
    vi.mocked(authService.getCurrentUser).mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      username: 'user',
      displayName: 'User',
    })
    vi.mocked(authService.logout).mockResolvedValue({ success: true })

    render(
      <AppProviders>
        <App />
      </AppProviders>,
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Logout' }))

    await waitFor(() => {
      expect(screen.getByText('Đăng nhập')).toBeInTheDocument()
    })
  })

  it('shows auth page when session is invalid', async () => {
    vi.mocked(authService.getCurrentUser).mockRejectedValue(new Error('unauthorized'))

    render(
      <AppProviders>
        <App />
      </AppProviders>,
    )

    expect(await screen.findByText('Đăng nhập')).toBeInTheDocument()
  })
})
