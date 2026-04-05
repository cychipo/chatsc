import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
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

describe('App', () => {
  it('renders the auth entry when the session is missing', async () => {
    vi.mocked(authService.refreshSession).mockRejectedValue(new Error('unauthorized'))

    render(
      <AppProviders>
        <App />
      </AppProviders>,
    )

    expect(await screen.findByText('Đăng nhập')).toBeInTheDocument()
  })
})
