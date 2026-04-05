import { SessionUser } from './auth-session'

export type AccessTokenPayload = {
  type: 'access'
  sub: string
  sid: string
}

export type RefreshSessionResponse = {
  accessToken: string
  user: SessionUser
  expiresInSeconds: number
}
