import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../api/auth.api";
import { useAuthStore } from "../model/auth.store";
import type { SignUpPayload } from "../model/types";

export function useSignUp() {
  const setSession = useAuthStore((s) => s.setSession);
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["auth", "sign-up"],
    mutationFn: (payload: SignUpPayload) => authApi.signUp(payload),
    onSuccess: (data) => {
      setSession({ accessToken: data.accessToken, refreshToken: data.refreshToken }, data.user.id);
      queryClient.setQueryData(["auth", "me"], data.user);
    },
  });
}
