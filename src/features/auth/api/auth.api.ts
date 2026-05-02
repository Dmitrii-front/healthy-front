import { apiClient } from "@/shared/api/client";
import { getMe } from "@/shared/api/get-me";
import type { AuthSuccess, RefreshSuccess, SignInPayload, SignUpPayload } from "../model/types";

export const authApi = {
  signIn: (payload: SignInPayload) =>
    apiClient.post<AuthSuccess>("/auth/login", payload, { skipAuth: true }),

  signUp: (payload: SignUpPayload) =>
    apiClient.post<AuthSuccess>("/auth/register", payload, { skipAuth: true }),

  signOut: () => apiClient.post<{ message: string }>("/auth/logout"),

  refresh: (userId: string, refreshToken: string) =>
    apiClient.post<RefreshSuccess>("/auth/refresh", { userId, refreshToken }, { skipAuth: true }),

  me: getMe,
};
