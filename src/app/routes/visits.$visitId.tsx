import { createFileRoute } from '@tanstack/react-router'

import { VisitDetailPage, visitDetailLoader } from '@/pages/visit-detail'
import { RouteError } from '@/shared/ui/RouteError'

export const Route = createFileRoute('/visits/$visitId')({
  loader: visitDetailLoader,
  component: VisitDetailPage,
  errorComponent: ({ error, reset }) => <RouteError error={error} reset={reset} />,
})
