import { LayoutShell } from './components/layout-shell'
import { ProtectedRoute } from './app/protected-route'
import { HomePage } from './pages/home.page'

export default function App() {
  return (
    <LayoutShell>
      <ProtectedRoute>
        <HomePage />
      </ProtectedRoute>
    </LayoutShell>
  )
}
