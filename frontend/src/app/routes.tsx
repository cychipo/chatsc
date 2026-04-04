import { AuthPage } from '../features/auth'
import { ChatPage } from '../features/chat'

export const featureRoutes = [
  {
    key: 'auth',
    element: AuthPage,
  },
  {
    key: 'chat',
    element: ChatPage,
  },
]
