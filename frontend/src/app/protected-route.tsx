import { PropsWithChildren } from 'react'
import { AuthPage } from '../features/auth'
import { useAuthStore } from '../store/auth.store'

export function ProtectedRoute({ children }: PropsWithChildren) {
  const { isAuthenticated, isHydrating } = useAuthStore()

  if (isHydrating) {
    return null
  }

  if (!isAuthenticated) {
    return <AuthPage />
  }

  return <>{children}</>
}
