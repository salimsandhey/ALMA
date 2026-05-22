import { create } from 'zustand'

export interface AuthUser {
  id: string
  email: string
  displayName: string
  role: 'STUDENT' | 'ADMIN'
  avatarUrl: string | null
  xpTotal: number
  streakCount: number
  isOnboardingComplete: boolean
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  setAuth: (token: string, user: AuthUser) => void
  setUser: (user: AuthUser) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  setAuth: (token, user) => set({ token, user, isAuthenticated: true }),
  setUser: (user) => set({ user }),
  clearAuth: () => set({ token: null, user: null, isAuthenticated: false }),
}))
