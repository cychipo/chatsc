import { http } from './http'

export async function getChatStatus() {
  const { data } = await http.get('/chat/status')
  return data
}
