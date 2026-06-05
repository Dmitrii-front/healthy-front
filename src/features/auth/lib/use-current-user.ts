import { useQuery } from '@tanstack/react-query'

import { AUTH_QUERIES } from '../api/auth.queries'
import { useAuthStore } from '../model/auth.store'

export function useCurrentUser() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return useQuery({
    ...AUTH_QUERIES.me(),
    enabled: isAuthenticated,
  })
}
