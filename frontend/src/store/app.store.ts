import { create } from 'zustand'

type AppStore = {
  apiBaseUrl: string
  setApiBaseUrl: (value: string) => void
}

export const useAppStore = create<AppStore>((set) => ({
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  setApiBaseUrl: (value) => set({ apiBaseUrl: value }),
}))
