import { AuthController } from '../src/modules/auth/auth.controller'

describe('AuthController', () => {
  const authService = {
    recordAttempt: jest.fn(),
    issueTokenPair: jest.fn(),
    revokeRefreshToken: jest.fn(),
  }

  beforeEach(() => {
    authService.recordAttempt.mockReset()
  })

  it('returns the current session user', () => {
    const controller = new AuthController(authService as never)

    const result = controller.getCurrentUser({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        username: 'test',
        displayName: 'Test User',
      },
    } as never)

    expect(result).toEqual({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        username: 'test',
        displayName: 'Test User',
      },
    })
  })

  it('destroys the session on logout', async () => {
    const controller = new AuthController(authService as never)
    const destroy = jest.fn((callback: (error?: Error) => void) => callback())

    await expect(
      controller.logout(
        {
          session: {
            destroy,
          },
          headers: {},
        } as never,
        { clearCookie: jest.fn() } as never,
      ),
    ).resolves.toEqual({ success: true })

    expect(destroy).toHaveBeenCalled()
  })

  it('builds failure redirect with auth error', async () => {
    const controller = new AuthController(authService as never)
    const redirect = jest.fn()

    await controller.handleGoogleFailure({ redirect } as never)

    expect(authService.recordAttempt).toHaveBeenCalledWith({
      result: 'cancelled',
      failureReason: 'google-auth-cancelled',
    })
    expect(redirect).toHaveBeenCalledWith('http://localhost:5173/?authError=google_auth_cancelled')
  })
})
