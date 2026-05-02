import { createFileRoute } from "@tanstack/react-router";
import { ConfirmationPage } from "@/pages/confirmation";

export const Route = createFileRoute("/confirmation")({
  staticData: { hideTabBar: true },
  component: ConfirmationPage,
});
