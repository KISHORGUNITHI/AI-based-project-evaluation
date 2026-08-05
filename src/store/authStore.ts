import { create } from 'zustand'
import type { User } from '@/types/auth'

interface AuthState {
  user: User | null
  token: string | null
  setUser: (user: User, token: string) => void
  clearAuth: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  setUser: (user, token) => set({ user, token }),
  clearAuth: () => set({ user: null, token: null }),
  isAuthenticated: () => !!get().token,
}))
