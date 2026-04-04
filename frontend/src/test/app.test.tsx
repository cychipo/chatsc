import { render, screen } from '@testing-library/react'
import App from '../App'
import { AppProviders } from '../app/providers'

describe('App', () => {
  it('renders the foundation heading', () => {
    render(
      <AppProviders>
        <App />
      </AppProviders>,
    )

    expect(screen.getByText('FE + BE Codebase Foundation')).toBeInTheDocument()
  })
})
