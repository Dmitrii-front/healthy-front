import { lazy } from 'react'

export { homeLoader } from './api/loader'
export const HomePage = lazy(() => import('./ui/HomePage').then((m) => ({ default: m.HomePage })))
