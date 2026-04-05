export type AuthUser = {
  id: string
  email: string
  username: string
  displayName: string
  avatarUrl?: string
}

export type SearchableUser = {
  id: string
  email: string
  username: string
  displayName: string
  avatarUrl?: string
}

export type AuthTokens = {
  accessToken: string
  expiresInSeconds: number
}

export type AuthSessionResponse = AuthTokens & {
  user: AuthUser
}

export type AuthStatus = {
  isAuthenticated: boolean
  user: AuthUser | null
  errorMessage?: string | null
}
