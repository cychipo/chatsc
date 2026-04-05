import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, MockedFunction, vi } from 'vitest'
import App from '../App'
import { AppProviders } from '../app/providers'
import * as authService from '../services/auth.service'
import { http, setAccessToken } from '../services/http'

function getResponseRejectedHandler() {
  return (http.interceptors.response as unknown as { handlers: Array<{ rejected: (error: unknown) => Promise<unknown> }> }).handlers[0]
    .rejected
}

function createExpiredTokenError() {
  return {
    config: {
      headers: {
        set: vi.fn(),
      },
    },
    response: {
      status: 401,
      data: {
        code: 'access_token_expired',
      },
    },
  }
}

function createBusinessError() {
  return {
    config: {
      headers: {
        set: vi.fn(),
      },
    },
    response: {
      status: 400,
      data: {
        code: 'business_error',
      },
    },
  }
}

vi.mock('../services/auth.service', async () => {
  const actual = await vi.importActual<typeof import('../services/auth.service')>('../services/auth.service')

  return {
    ...actual,
    getCurrentUser: vi.fn(),
    logout: vi.fn(),
    refreshSession: vi.fn(),
  }
})

describe('OAuth session flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
    setAccessToken(null)
    window.history.replaceState({}, document.title, '/')
  })

  it('hydrates authenticated session on app load via refresh session', async () => {
    vi.mocked(authService.refreshSession).mockResolvedValue({
      accessToken: 'access-token',
      expiresInSeconds: 1800,
      user: {
        id: 'user-1',
        email: 'user@example.com',
        username: 'user',
        displayName: 'User',
      },
    })
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
    expect(authService.refreshSession).toHaveBeenCalledTimes(1)
    expect(window.localStorage.getItem('accessToken')).toBe('access-token')
  })

  it('returns to auth page after logout', async () => {
    vi.mocked(authService.refreshSession).mockResolvedValue({
      accessToken: 'access-token',
      expiresInSeconds: 1800,
      user: {
        id: 'user-1',
        email: 'user@example.com',
        username: 'user',
        displayName: 'User',
      },
    })
    vi.mocked(authService.getCurrentUser).mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      username: 'user',
      displayName: 'User',
    })
    ;(authService.logout as MockedFunction<typeof authService.logout>).mockResolvedValue({ success: true })

    render(
      <AppProviders>
        <App />
      </AppProviders>,
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Logout' }))

    await waitFor(() => {
      expect(screen.getByText('Đăng nhập')).toBeInTheDocument()
    })
    expect(window.localStorage.getItem('accessToken')).toBeNull()
  })

  it('shows auth page when refresh session is invalid', async () => {
    vi.mocked(authService.refreshSession).mockRejectedValue(new Error('unauthorized'))

    render(
      <AppProviders>
        <App />
      </AppProviders>,
    )

    expect(await screen.findByText('Đăng nhập')).toBeInTheDocument()
    expect(window.localStorage.getItem('accessToken')).toBeNull()
  })

  it('refreshes and retries a protected request once when access token expires', async () => {
    vi.mocked(authService.refreshSession).mockResolvedValueOnce({
      accessToken: 'initial-access-token',
      expiresInSeconds: 1800,
      user: {
        id: 'user-1',
        email: 'user@example.com',
        username: 'user',
        displayName: 'User',
      },
    })
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

    await screen.findByText('Welcome back')

    const requestSpy = vi.spyOn(http, 'request').mockResolvedValue({
      data: { ok: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { headers: { set: vi.fn() } } as never,
    })

    vi.mocked(authService.refreshSession).mockResolvedValueOnce({
      accessToken: 'refreshed-access-token',
      expiresInSeconds: 1800,
      user: {
        id: 'user-1',
        email: 'user@example.com',
        username: 'user',
        displayName: 'User',
      },
    })

    const rejectedHandler = getResponseRejectedHandler()
    const result = await rejectedHandler(createExpiredTokenError())

    expect(result).toMatchObject({ data: { ok: true } })
    expect(authService.refreshSession).toHaveBeenCalledTimes(2)
    expect(requestSpy).toHaveBeenCalledTimes(1)
    expect(window.localStorage.getItem('accessToken')).toBe('refreshed-access-token')
  })

  it('clears auth state when refresh after expiry fails', async () => {
    vi.mocked(authService.refreshSession).mockResolvedValueOnce({
      accessToken: 'initial-access-token',
      expiresInSeconds: 1800,
      user: {
        id: 'user-1',
        email: 'user@example.com',
        username: 'user',
        displayName: 'User',
      },
    })
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

    await screen.findByText('Welcome back')

    vi.mocked(authService.refreshSession).mockRejectedValueOnce(new Error('refresh failed'))

    const rejectedHandler = getResponseRejectedHandler()
    await expect(rejectedHandler(createExpiredTokenError())).rejects.toBeTruthy()

    await waitFor(() => {
      expect(screen.getByText('Đăng nhập')).toBeInTheDocument()
    })
    expect(window.localStorage.getItem('accessToken')).toBeNull()
  })

  it('uses one shared refresh promise for concurrent expired requests', async () => {
    vi.mocked(authService.refreshSession).mockResolvedValueOnce({
      accessToken: 'initial-access-token',
      expiresInSeconds: 1800,
      user: {
        id: 'user-1',
        email: 'user@example.com',
        username: 'user',
        displayName: 'User',
      },
    })
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

    await screen.findByText('Welcome back')

    const requestSpy = vi.spyOn(http, 'request').mockResolvedValue({
      data: { ok: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { headers: { set: vi.fn() } } as never,
    })

    let resolveRefresh: ((value: Awaited<ReturnType<typeof authService.refreshSession>>) => void) | undefined
    vi.mocked(authService.refreshSession).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRefresh = resolve
        }),
    )

    const rejectedHandler = getResponseRejectedHandler()
    const promiseOne = rejectedHandler(createExpiredTokenError())
    const promiseTwo = rejectedHandler(createExpiredTokenError())

    resolveRefresh?.({
      accessToken: 'shared-refreshed-token',
      expiresInSeconds: 1800,
      user: {
        id: 'user-1',
        email: 'user@example.com',
        username: 'user',
        displayName: 'User',
      },
    })

    await expect(Promise.all([promiseOne, promiseTwo])).resolves.toHaveLength(2)
    expect(authService.refreshSession).toHaveBeenCalledTimes(2)
    expect(requestSpy).toHaveBeenCalledTimes(2)
  })

  it('returns the original business error without refreshing', async () => {
    vi.mocked(authService.refreshSession).mockResolvedValueOnce({
      accessToken: 'initial-access-token',
      expiresInSeconds: 1800,
      user: {
        id: 'user-1',
        email: 'user@example.com',
        username: 'user',
        displayName: 'User',
      },
    })
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

    await screen.findByText('Welcome back')

    const rejectedHandler = getResponseRejectedHandler()
    const businessError = createBusinessError()

    await expect(rejectedHandler(businessError)).rejects.toBe(businessError)
    expect(authService.refreshSession).toHaveBeenCalledTimes(1)
  })
})
