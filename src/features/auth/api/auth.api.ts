import { apiClient, getMe } from '@/shared/api'

import type { RefreshSuccess } from '../model/types'

/**
 * Auth API surface inside the SPA. The SPA is a fully-protected zone — sign-in,
 * sign-up, forgot/reset password, and email verification live on the Astro
 * marketing site (SEO zone). The SPA only needs to: read the current session
 * (`me`), refresh tokens silently (`refresh`), and clear server-side state on
 * sign-out (`signOut`).
 */
export const authApi = {
  signOut: () => apiClient.post<{ message: string }>('/auth/logout'),

  refresh: (userId: string, refreshToken: string) =>
    apiClient.post<RefreshSuccess>('/auth/refresh', { userId, refreshToken }, { skipAuth: true }),

  me: getMe,
}
