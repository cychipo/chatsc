import { create } from 'zustand'
import { AuthUser } from '../types/auth'
import { getCurrentUser, logout } from '../services/auth.service'

type AuthStore = {
  currentUser: AuthUser | null
  isAuthenticated: boolean
  isHydrating: boolean
  errorMessage: string | null
  hydrateSession: () => Promise<void>
  setErrorMessage: (message: string | null) => void
  clearError: () => void
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  currentUser: null,
  isAuthenticated: false,
  isHydrating: true,
  errorMessage: null,
  hydrateSession: async () => {
    set({ isHydrating: true })

    try {
      const user = await getCurrentUser()
      set({ currentUser: user, isAuthenticated: true, isHydrating: false, errorMessage: null })
    } catch {
      set({ currentUser: null, isAuthenticated: false, isHydrating: false })
    }
  },
  setErrorMessage: (message) => set({ errorMessage: message }),
  clearError: () => set({ errorMessage: null }),
  logout: async () => {
    await logout()
    set({ currentUser: null, isAuthenticated: false, errorMessage: null })
  },
}))
