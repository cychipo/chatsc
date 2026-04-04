import { AuthPage } from '../features/auth'
import { HomePage } from '../pages/home.page'

export const featureRoutes = [
  {
    key: 'auth',
    element: AuthPage,
  },
  {
    key: 'home',
    element: HomePage,
  },
]
