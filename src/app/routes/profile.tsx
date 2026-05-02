import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage, profileLoader } from "@/pages/profile";

export const Route = createFileRoute("/profile")({
  loader: profileLoader,
  component: ProfilePage,
});
