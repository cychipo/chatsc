import { LayoutShell } from './components/layout-shell'
import { ProtectedRoute } from './app/protected-route'
import { ChatPage } from './features/chat'

export default function App() {
  return (
    <LayoutShell>
      <ProtectedRoute>
        <ChatPage />
      </ProtectedRoute>
    </LayoutShell>
  )
}
