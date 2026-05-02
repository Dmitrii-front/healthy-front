import { createFileRoute } from "@tanstack/react-router";
import { HistoryPage, historyLoader } from "@/pages/history";

export const Route = createFileRoute("/history")({
  loader: historyLoader,
  component: HistoryPage,
});
