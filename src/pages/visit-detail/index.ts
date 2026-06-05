import { lazy } from 'react'

export { visitDetailLoader } from './api/loader'
export const VisitDetailPage = lazy(() =>
  import('./ui/VisitDetailPage').then((m) => ({ default: m.VisitDetailPage })),
)
