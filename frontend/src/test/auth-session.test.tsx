import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, MockedFunction, vi } from 'vitest'
import App from '../App'
import { AppProviders } from '../app/providers'
import * as authService from '../services/auth.service'
import { getAccessToken, http, setAccessToken } from '../services/http'
import { useAuthStore } from '../store/auth.store'

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
    useAuthStore.setState({
      currentUser: null,
      accessToken: null,
      isAuthenticated: false,
      isHydrating: true,
      errorMessage: null,
    })
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

    await waitFor(() => {
      expect(authService.refreshSession).toHaveBeenCalledTimes(1)
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
      expect(getAccessToken()).toBe('access-token')
    })
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

    useAuthStore.setState({
      currentUser: {
        id: 'user-1',
        email: 'user@example.com',
        username: 'user',
        displayName: 'User',
      },
      accessToken: 'access-token',
      isAuthenticated: true,
      isHydrating: false,
      errorMessage: null,
    })
    setAccessToken('access-token')

    render(<App />)

    fireEvent.click(await screen.findByRole('button', { name: 'Đăng xuất' }))

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

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })

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
    let result: unknown
    await act(async () => {
      result = await rejectedHandler(createExpiredTokenError())
    })

    expect(result).toMatchObject({ data: { ok: true } })
    expect(vi.mocked(authService.refreshSession).mock.calls.length).toBeGreaterThanOrEqual(2)
    expect(requestSpy).toHaveBeenCalledTimes(1)
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

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })

    vi.mocked(authService.refreshSession).mockRejectedValueOnce(new Error('refresh failed'))

    const rejectedHandler = getResponseRejectedHandler()
    await act(async () => {
      await expect(rejectedHandler(createExpiredTokenError())).rejects.toBeTruthy()
    })

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

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })

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
    let results: unknown[] | undefined
    await act(async () => {
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

      results = await Promise.all([promiseOne, promiseTwo])
    })

    expect(results).toHaveLength(2)
    expect(vi.mocked(authService.refreshSession).mock.calls.length).toBeGreaterThanOrEqual(2)
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

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })

    const rejectedHandler = getResponseRejectedHandler()
    const businessError = createBusinessError()

    await expect(rejectedHandler(businessError)).rejects.toBe(businessError)
    expect(authService.refreshSession).toHaveBeenCalledTimes(1)
  })
})
