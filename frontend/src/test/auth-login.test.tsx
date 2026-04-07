import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, vi } from 'vitest'
import App from '../App'
import { AppProviders } from '../app/providers'
import * as authService from '../services/auth.service'
import { useAuthStore } from '../store/auth.store'

vi.mock('../services/auth.service', async () => {
  const actual = await vi.importActual<typeof import('../services/auth.service')>('../services/auth.service')

  return {
    ...actual,
    getCurrentUser: vi.fn(),
    refreshSession: vi.fn(),
    startGoogleLogin: vi.fn(),
  }
})

describe('OAuth login flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
    useAuthStore.setState({
      currentUser: null,
      accessToken: null,
      isAuthenticated: false,
      isHydrating: true,
      errorMessage: null,
    })
    vi.mocked(authService.getCurrentUser).mockReset()
    vi.mocked(authService.refreshSession).mockReset()
    vi.mocked(authService.startGoogleLogin).mockReset()
    window.history.replaceState({}, document.title, '/')
  })

  it('renders login CTA when session is not available', async () => {
    vi.mocked(authService.refreshSession).mockRejectedValue(new Error('unauthorized'))

    render(
      <AppProviders>
        <App />
      </AppProviders>,
    )

    expect(await screen.findByText('Đăng nhập')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tiếp tục với Google' })).toBeInTheDocument()
  })

  it('starts Google login when CTA is clicked', async () => {
    vi.mocked(authService.refreshSession).mockRejectedValue(new Error('unauthorized'))

    render(
      <AppProviders>
        <App />
      </AppProviders>,
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Tiếp tục với Google' }))

    expect(authService.startGoogleLogin).toHaveBeenCalled()
  })

  it('renders protected home when session exists', async () => {
    useAuthStore.setState({
      currentUser: {
        id: 'user-1',
        email: 'alice@example.com',
        username: 'alice',
        displayName: 'Alice',
      },
      accessToken: 'access-token',
      isAuthenticated: true,
      isHydrating: false,
      errorMessage: null,
    })

    render(<App />)

    expect(await screen.findByText((content) => content.includes('alice@example.com'))).toBeInTheDocument()
    expect(screen.getByText((content) => content.includes('@alice'))).toBeInTheDocument()
    expect(screen.getByText('Đăng xuất')).toBeInTheDocument()
  })

  it('shows auth error from redirect query string', async () => {
    vi.mocked(authService.refreshSession).mockRejectedValue(new Error('unauthorized'))
    window.history.replaceState({}, document.title, '/?authError=google_auth_cancelled')

    render(
      <AppProviders>
        <App />
      </AppProviders>,
    )

    expect(await screen.findByText('Google login was cancelled. Please try again.')).toBeInTheDocument()

    await waitFor(() => {
      expect(window.location.search).toBe('')
    })
  })
})
