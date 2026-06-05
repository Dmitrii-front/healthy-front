import { queryOptions } from '@tanstack/react-query'

import { authStore } from '../model/auth.store'
import { authApi } from './auth.api'

export const AUTH_QUERIES = {
  all: () => ['auth'] as const,
  me: () =>
    queryOptions({
      queryKey: [...AUTH_QUERIES.all(), 'me'],
      queryFn: () => authApi.me(),
      enabled: authStore.getState().isAuthenticated,
      staleTime: 5 * 60_000,
    }),
} as const
