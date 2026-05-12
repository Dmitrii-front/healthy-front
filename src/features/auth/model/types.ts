import type { User } from "@/entities/user";

export interface SignInPayload {
  email: string;
  password: string;
}

export interface SignUpPayload {
  email: string;
  password: string;
  phone?: string;
}

export interface AuthSuccess {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshSuccess {
  accessToken: string;
  refreshToken: string;
}
