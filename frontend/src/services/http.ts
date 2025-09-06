import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios'

export type AuthRequestConfig = AxiosRequestConfig & {
  skipAuthRefresh?: boolean
}

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _retry?: boolean
    skipAuthRefresh?: boolean
  }
}

const ACCESS_TOKEN_STORAGE_KEY = 'chatsc.accessToken'

let accessToken: string | null = typeof window === 'undefined' ? null : window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
let refreshPromise: Promise<string | null> | null = null
let refreshSessionHandler: null | (() => Promise<string | null>) = null
let authFailureHandler: null | (() => void) = null

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

export function setAccessToken(token: string | null) {
  accessToken = token

  if (typeof window === 'undefined') {
    return
  }

  if (token) {
    window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token)
    return
  }

  window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
}

export function getAccessToken() {
  return accessToken
}

export function setRefreshSessionHandler(handler: (() => Promise<string | null>) | null) {
  refreshSessionHandler = handler
}

export function setAuthFailureHandler(handler: (() => void) | null) {
  authFailureHandler = handler
}

async function runSharedRefresh() {
  if (!refreshSessionHandler) {
    return null
  }

  if (!refreshPromise) {
    refreshPromise = refreshSessionHandler().finally(() => {
      refreshPromise = null
    })
  }

  return refreshPromise
}

http.interceptors.request.use((config) => {
  const nextConfig = config as InternalAxiosRequestConfig

  if (accessToken) {
    nextConfig.headers.set('Authorization', `Bearer ${accessToken}`)
  }

  return nextConfig
})

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const responseCode = (error.response?.data as { code?: string } | undefined)?.code
    const config = error.config as InternalAxiosRequestConfig | undefined

    if (!config || config.skipAuthRefresh || config._retry) {
      throw error
    }

    if (error.response?.status !== 401 || responseCode !== 'access_token_expired') {
      throw error
    }

    config._retry = true

    try {
      const refreshedToken = await runSharedRefresh()

      if (!refreshedToken) {
        authFailureHandler?.()
        throw error
      }

      config.headers.set('Authorization', `Bearer ${refreshedToken}`)
      return await http.request(config)
    } catch (refreshError) {
      setAccessToken(null)
      authFailureHandler?.()
      throw refreshError
    }
  },
)
