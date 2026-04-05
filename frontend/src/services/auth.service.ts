import { AuthRequestConfig, http, setAccessToken } from './http'
import {
  AuthSessionResponse,
  AuthUser,
  LoginLocalAuthRequest,
  RegisterLocalAuthRequest,
  SearchableUser,
} from '../types/auth'

export function startGoogleLogin() {
  window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`
}

export async function getCurrentUser(): Promise<AuthUser> {
  const { data } = await http.get<{ user: AuthUser }>('/auth/me', { withCredentials: true })
  return data.user
}

export async function registerLocalAccount(payload: RegisterLocalAuthRequest): Promise<AuthSessionResponse> {
  const response = await http.post<AuthSessionResponse>('/auth/register', payload, {
    withCredentials: true,
  })
  const data = response.data
  setAccessToken(data.accessToken)
  return data
}

export async function loginLocalAccount(payload: LoginLocalAuthRequest): Promise<AuthSessionResponse> {
  const response = await http.post<AuthSessionResponse>('/auth/login', payload, {
    withCredentials: true,
  })
  const data = response.data
  setAccessToken(data.accessToken)
  return data
}

export async function refreshSession(): Promise<AuthSessionResponse> {
  const config: AuthRequestConfig = {
    withCredentials: true,
    skipAuthRefresh: true,
  }
  const response = await http.post<AuthSessionResponse>('/auth/refresh', undefined, config)
  const data = response.data

  setAccessToken(data.accessToken)
  return data
}

export async function logout() {
  const config: AuthRequestConfig = {
    withCredentials: true,
    skipAuthRefresh: true,
  }
  const { data } = await http.post<{ success: boolean }>('/auth/logout', undefined, config)
  setAccessToken(null)
  return data
}

export async function searchUsers(query: string): Promise<SearchableUser[]> {
  const { data } = await http.get<{ success: true; data: SearchableUser[] }>('/auth/users/search', {
    params: { q: query },
  })
  return data.data
}

export function readAuthErrorFromLocation(search: string) {
  const params = new URLSearchParams(search)
  return params.get('authError')
}

export function toAuthErrorMessage(authError: string | null) {
  switch (authError) {
    case 'google_auth_cancelled':
      return 'Google login was cancelled. Please try again.'
    case 'oauth_failed':
      return 'Google login failed. Please try again.'
    default:
      return null
  }
}
