import 'express-session'

export type SessionUser = {
  id: string
  email: string
  username: string
  displayName: string
  avatarUrl?: string
}

export type AuthSessionState = {
  user?: SessionUser
}

declare module 'express-session' {
  interface SessionData extends AuthSessionState {}
}
