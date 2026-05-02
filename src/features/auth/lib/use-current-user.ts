import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../model/auth.store";
import { AUTH_QUERIES } from "../api/auth.queries";

export function useCurrentUser() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    ...AUTH_QUERIES.me(),
    enabled: isAuthenticated,
  });
}
