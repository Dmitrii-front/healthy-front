import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../api/auth.api";
import { useAuthStore } from "../model/auth.store";
import type { SignInPayload } from "../model/types";

export function useSignIn() {
  const setSession = useAuthStore((s) => s.setSession);
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["auth", "sign-in"],
    mutationFn: (payload: SignInPayload) => authApi.signIn(payload),
    onSuccess: (data) => {
      setSession({ accessToken: data.accessToken, refreshToken: data.refreshToken }, data.user.id);
      queryClient.setQueryData(["auth", "me"], data.user);
    },
  });
}
