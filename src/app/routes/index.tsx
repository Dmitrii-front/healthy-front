import { createFileRoute } from '@tanstack/react-router'

import { HomePage, homeLoader } from '@/pages/home'

export const Route = createFileRoute('/')({
  loader: homeLoader,
  component: HomePage,
})
