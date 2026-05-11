/**
 * Auth helpers for the public Astro flow (login/register/booking modals).
 * No React imports — plain `fetch` to the NestJS backend, validation via
 * Valibot. Valibot is fully tree-shakeable and ~10× smaller than zod/mini
 * after deduplication (no shared 40 KB kernel), keeping the SEO bundle tiny.
 *
 * On success writes `{accessToken, refreshToken, userId}` to localStorage
 * key `healthy.auth` in zustand persist v0 format so the React SPA at
 * `/app/*` sees the session without extra wiring.
 *
 * `quickBook` is still a mock — backend has no `/appointments/quick-book`
 * yet. Replace with a real `apiFetch` call when it lands.
 *
 * SPA continues to use full `zod` (chained API + better DX). Validation
 * rules below mirror the NestJS `class-validator` constraints so error
 * messages stay aligned across both clients.
 */

import * as v from "valibot";

export const AUTH_STORAGE_KEY = "healthy.auth";

const API_URL = (import.meta.env.PUBLIC_API_URL as string | undefined) ?? "http://localhost:3000";

interface AuthState {
  accessToken: string;
  refreshToken: string;
  userId: string;
  isAuthenticated: boolean;
}

interface AuthSnapshot {
  state: AuthState;
  version: 0;
}

interface BackendUser {
  id: string;
  email: string;
  phone: string | null;
  role: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface BackendAuthResponse {
  user: BackendUser;
  accessToken: string;
  refreshToken: string;
}

/* ─── Storage ────────────────────────────────────────────────────────── */

export function writeAuth(input: {
  accessToken: string;
  refreshToken: string;
  userId: string;
}): AuthState {
  const state: AuthState = { ...input, isAuthenticated: true };
  const snapshot: AuthSnapshot = { state, version: 0 };
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(snapshot));
  return state;
}

export function readAuth(): AuthState | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSnapshot;
    return parsed.state ?? null;
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function isAuthed(): boolean {
  return Boolean(readAuth()?.isAuthenticated);
}

/* ─── Validation (valibot) ───────────────────────────────────────────── */

export const EmailSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1, "Введите email"),
  v.email("Введите корректный email"),
);

/** Mirrors the NestJS rule: ≥ 8 chars, ≥ 1 uppercase, ≥ 1 digit. */
export const PasswordSchema = v.pipe(
  v.string(),
  v.minLength(8, "Минимум 8 символов"),
  v.regex(/[A-ZА-Я]/, "Должна быть хотя бы одна заглавная буква"),
  v.regex(/[0-9]/, "Должна быть хотя бы одна цифра"),
);

/** Lighter rule for login (we only check non-empty, server validates the rest). */
export const LoginPasswordSchema = v.pipe(v.string(), v.minLength(1, "Введите пароль"));

export const LoginSchema = v.object({
  email: EmailSchema,
  password: LoginPasswordSchema,
});

export const RegisterSchema = v.object({
  email: EmailSchema,
  password: PasswordSchema,
});

export type LoginInput = v.InferInput<typeof LoginSchema>;
export type RegisterInput = v.InferInput<typeof RegisterSchema>;

/* ─── Real auth (NestJS) ─────────────────────────────────────────────── */

export interface AuthResponse {
  userId: string;
  isNewUser: boolean;
}

export async function loginWithEmail(email: string, password: string): Promise<AuthResponse> {
  const result = v.safeParse(LoginSchema, { email, password });
  if (!result.success) {
    throw new Error(result.issues[0]?.message ?? "Проверьте данные");
  }
  const response = await apiFetch<BackendAuthResponse>("/auth/login", {
    email: result.output.email,
    password: result.output.password,
  });
  writeAuth({
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    userId: response.user.id,
  });
  return { userId: response.user.id, isNewUser: false };
}

export async function registerWithEmail(email: string, password: string): Promise<AuthResponse> {
  const result = v.safeParse(RegisterSchema, { email, password });
  if (!result.success) {
    throw new Error(result.issues[0]?.message ?? "Проверьте данные");
  }
  const response = await apiFetch<BackendAuthResponse>("/auth/register", {
    email: result.output.email,
    password: result.output.password,
    role: "patient",
  });
  writeAuth({
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    userId: response.user.id,
  });
  return { userId: response.user.id, isNewUser: true };
}

/* ─── Booking (mock until backend exposes /appointments/quick-book) ──── */

export interface QuickBookInput {
  doctorId: string;
  slotId: string;
  email?: string;
}

export interface QuickBookResult {
  appointmentId: string;
  scheduledAt: string;
}

export async function quickBook(input: QuickBookInput): Promise<QuickBookResult> {
  await wait(400);
  return {
    appointmentId: `a-${input.slotId}-${Date.now()}`,
    scheduledAt: new Date().toISOString(),
  };
}

/* ─── Internals ──────────────────────────────────────────────────────── */

interface ApiErrorBody {
  message?: string | string[];
  statusCode?: number;
}

async function apiFetch<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(new URL(path, API_URL), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Сервер недоступен. Проверьте подключение.");
  }

  if (response.ok) {
    return (await response.json()) as T;
  }

  const errBody = (await response.json().catch(() => null)) as ApiErrorBody | null;
  throw new Error(formatBackendError(response.status, errBody));
}

function formatBackendError(status: number, body: ApiErrorBody | null): string {
  const msg = body?.message;
  const flat = Array.isArray(msg) ? msg.join("; ") : msg;
  if (flat) return flat;
  if (status === 401) return "Неверный email или пароль";
  if (status === 409) return "Аккаунт с таким email уже существует";
  if (status === 400) return "Проверьте email и пароль";
  if (status >= 500) return "Сервер недоступен. Попробуйте через минуту";
  return `Ошибка ${status}`;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
