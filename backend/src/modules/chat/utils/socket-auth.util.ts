import { AuthService } from '../../auth/auth.service'
import { SessionUser } from '../../auth/types/auth-session'
import { Socket } from 'socket.io'

function readToken(client: Socket) {
  const authToken = client.handshake.auth?.token

  if (typeof authToken === 'string' && authToken.trim()) {
    return authToken.trim()
  }

  const authorization = client.handshake.headers.authorization

  if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
    const token = authorization.slice('Bearer '.length).trim()
    if (token) {
      return token
    }
  }

  return null
}

export async function authenticateSocketClient(
  client: Socket,
  authService: AuthService,
): Promise<SessionUser | null> {
  const token = readToken(client)

  if (!token) {
    return null
  }

  return authService.authenticateAccessToken(token)
}
