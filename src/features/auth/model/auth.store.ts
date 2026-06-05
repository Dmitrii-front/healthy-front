import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface AuthTokens {
  accessToken: string
  refreshToken: string
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  userId: string | null
  isAuthenticated: boolean
  setSession: (tokens: AuthTokens, userId: string) => void
  setTokens: (tokens: AuthTokens) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      userId: null,
      isAuthenticated: false,
      setSession: (tokens, userId) =>
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          userId,
          isAuthenticated: true,
        }),
      setTokens: (tokens) =>
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        }),
      clear: () => {
        set({
          accessToken: null,
          refreshToken: null,
          userId: null,
          isAuthenticated: false,
        })
        useAuthStore.persist.clearStorage()
      },
    }),
    {
      name: 'healthy.auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        userId: state.userId,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)

/** Imperative accessor for non-React code (e.g. fetch interceptor). */
const _setState = useAuthStore.setState.bind(useAuthStore)
export const authStore = {
  getState: () => useAuthStore.getState(),
  setState: _setState,
}
