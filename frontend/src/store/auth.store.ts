import { create } from 'zustand'
import { getCurrentUser, loginLocalAccount, logout, refreshSession, registerLocalAccount } from '../services/auth.service'
import { setAccessToken, setAuthFailureHandler, setRefreshSessionHandler } from '../services/http'
import { AuthUser, LoginLocalAuthRequest, RegisterLocalAuthRequest } from '../types/auth'

type AuthStore = {
  currentUser: AuthUser | null
  accessToken: string | null
  isAuthenticated: boolean
  isHydrating: boolean
  errorMessage: string | null
  hydrateSession: () => Promise<void>
  refreshSession: () => Promise<string | null>
  registerLocalAccount: (payload: RegisterLocalAuthRequest) => Promise<void>
  loginLocalAccount: (payload: LoginLocalAuthRequest) => Promise<void>
  setErrorMessage: (message: string | null) => void
  clearError: () => void
  logout: () => Promise<void>
  clearSession: () => void
}

export const useAuthStore = create<AuthStore>((set, get) => {
  const clearSession = () => {
    setAccessToken(null)
    set({
      currentUser: null,
      accessToken: null,
      isAuthenticated: false,
      isHydrating: false,
    })
  }

  const refreshAccessToken = async () => {
    try {
      const data = await refreshSession()
      setAccessToken(data.accessToken)
      set({
        currentUser: data.user,
        accessToken: data.accessToken,
        isAuthenticated: true,
        isHydrating: false,
        errorMessage: null,
      })
      return data.accessToken
    } catch {
      clearSession()
      return null
    }
  }

  setRefreshSessionHandler(refreshAccessToken)
  setAuthFailureHandler(clearSession)

  const setAuthenticatedSession = (payload: { user: AuthUser; accessToken: string }) => {
    setAccessToken(payload.accessToken)
    set({
      currentUser: payload.user,
      accessToken: payload.accessToken,
      isAuthenticated: true,
      isHydrating: false,
      errorMessage: null,
    })
  }

  return {
    currentUser: null,
    accessToken: null,
    isAuthenticated: false,
    isHydrating: true,
    errorMessage: null,
    hydrateSession: async () => {
      set({ isHydrating: true })

      const token = await refreshAccessToken()

      if (!token) {
        clearSession()
        return
      }

      try {
        const user = await getCurrentUser()
        set({ currentUser: user, accessToken: token, isAuthenticated: true, isHydrating: false, errorMessage: null })
      } catch {
        clearSession()
      }
    },
    refreshSession: refreshAccessToken,
    registerLocalAccount: async (payload) => {
      const data = await registerLocalAccount(payload)
      setAuthenticatedSession({ user: data.user, accessToken: data.accessToken })
    },
    loginLocalAccount: async (payload) => {
      const data = await loginLocalAccount(payload)
      setAuthenticatedSession({ user: data.user, accessToken: data.accessToken })
    },
    setErrorMessage: (message) => set({ errorMessage: message }),
    clearError: () => set({ errorMessage: null }),
    logout: async () => {
      await logout()
      get().clearSession()
      set({ errorMessage: null })
    },
    clearSession,
  }
})
