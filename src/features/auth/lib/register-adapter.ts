import { registerAuthAdapter } from "@/shared/api/client";
import { authApi } from "../api/auth.api";
import { authStore } from "../model/auth.store";

/**
 * Wires the api client to the auth store. Call once at app boot before any request.
 */
export function bootstrapAuth() {
  registerAuthAdapter({
    getAccessToken: () => authStore.getState().accessToken,
    refresh: async () => {
      const { userId, refreshToken } = authStore.getState();
      if (!userId || !refreshToken) return null;
      try {
        const fresh = await authApi.refresh(userId, refreshToken);
        authStore.setState({
          accessToken: fresh.accessToken,
          refreshToken: fresh.refreshToken,
        });
        return fresh.accessToken;
      } catch {
        authStore.getState().clear();
        return null;
      }
    },
    onAuthFailure: () => {
      authStore.getState().clear();
    },
  });
}
