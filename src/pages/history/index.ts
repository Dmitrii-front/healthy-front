import { lazy } from 'react'

export { historyLoader } from './api/loader'
export const HistoryPage = lazy(() =>
  import('./ui/HistoryPage').then((m) => ({ default: m.HistoryPage })),
)
