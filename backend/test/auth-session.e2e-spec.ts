import { AuthController } from '../src/modules/auth/auth.controller'

describe('AuthController session flow', () => {
  const authService = {
    recordAttempt: jest.fn(),
  }

  beforeEach(() => {
    authService.recordAttempt.mockReset()
  })

  it('returns the session user when session is valid', () => {
    const controller = new AuthController(authService as never)

    const result = controller.getCurrentUser({
      session: {
        user: {
          id: 'user-1',
          email: 'user@example.com',
          username: 'user',
          displayName: 'User',
        },
      },
    } as never)

    expect(result.user?.email).toBe('user@example.com')
  })

  it('clears the session on logout', async () => {
    const controller = new AuthController(authService as never)
    const destroy = jest.fn((callback: (error?: Error) => void) => callback())

    await controller.logout({ session: { destroy } } as never)

    expect(destroy).toHaveBeenCalledTimes(1)
  })
})
