import { lazy } from 'react'

export { profileLoader } from './api/loader'
export const ProfilePage = lazy(() =>
  import('./ui/ProfilePage').then((m) => ({ default: m.ProfilePage })),
)
