import { lazy } from 'react'

export { visitsLoader } from './api/loader'
export const VisitsPage = lazy(() =>
  import('./ui/VisitsPage').then((m) => ({ default: m.VisitsPage })),
)
