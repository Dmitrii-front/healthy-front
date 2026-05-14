import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { VisitsPage, visitsLoader } from "@/pages/visits";
import { RouteError } from "@/shared/ui/RouteError";

const visitsSearchSchema = z.object({
  tab: z.enum(["upcoming", "past"]).default("upcoming"),
});

export const Route = createFileRoute("/visits/")({
  validateSearch: (search) => visitsSearchSchema.parse(search),
  loader: visitsLoader,
  component: VisitsPage,
  errorComponent: ({ error, reset }) => <RouteError error={error} reset={reset} />,
});
