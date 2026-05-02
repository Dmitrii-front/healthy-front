import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../api/auth.api";
import { useAuthStore } from "../model/auth.store";

export function useSignOut() {
  const clear = useAuthStore((s) => s.clear);
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["auth", "sign-out"],
    mutationFn: async () => {
      try {
        await authApi.signOut();
      } catch {
        // Even if the server call fails (e.g. token already revoked), wipe local state.
      }
    },
    onSettled: () => {
      clear();
      queryClient.clear();
    },
  });
}
