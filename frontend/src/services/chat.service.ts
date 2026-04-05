import { http } from './http'
import { AuthUser } from '../types/auth'

export async function getChatStatus() {
  const { data } = await http.get<{ feature: 'chat'; status: string; user?: AuthUser }>('/chat/status')
  return data
}
