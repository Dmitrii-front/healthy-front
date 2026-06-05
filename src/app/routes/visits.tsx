import { createFileRoute, Outlet } from '@tanstack/react-router'

// Layout route for /visits/* — children declare their own components,
// loaders and search schemas. The detail route mounts here as a sibling
// of the list (visits.index.tsx) under the same path prefix.
export const Route = createFileRoute('/visits')({
  component: () => <Outlet />,
})
