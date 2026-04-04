import { http } from './http'

export async function getAuthStatus() {
  const { data } = await http.get('/auth/status')
  return data
}
