export type AuthUser = {
  id: string
  email: string
  username: string
  displayName: string
  avatarUrl?: string
}

export type AuthStatus = {
  isAuthenticated: boolean
  user: AuthUser | null
  errorMessage?: string | null
}
