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

import * as v from 'valibot'

export const AUTH_STORAGE_KEY = 'healthy.auth'

const API_URL = (import.meta.env.PUBLIC_API_URL as string | undefined) ?? 'http://localhost:3000'

interface AuthState {
  accessToken: string
  refreshToken: string
  userId: string
  isAuthenticated: boolean
}

interface AuthSnapshot {
  state: AuthState
  version: 0
}

interface BackendUser {
  id: string
  email: string
  phone: string | null
  role: string
  isEmailVerified: boolean
  isPhoneVerified: boolean
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

interface BackendAuthResponse {
  user: BackendUser
  accessToken: string
  refreshToken: string
}

/* ─── Storage ────────────────────────────────────────────────────────── */

export function writeAuth(input: {
  accessToken: string
  refreshToken: string
  userId: string
}): AuthState {
  const state: AuthState = { ...input, isAuthenticated: true }
  const snapshot: AuthSnapshot = { state, version: 0 }
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(snapshot))
  return state
}

export function readAuth(): AuthState | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthSnapshot
    return parsed.state ?? null
  } catch {
    return null
  }
}

export function clearAuth(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

export function isAuthed(): boolean {
  return Boolean(readAuth()?.isAuthenticated)
}

/* ─── Validation (valibot) ───────────────────────────────────────────── */

export const EmailSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1, 'Введите email'),
  v.email('Введите корректный email'),
)

/** Mirrors the NestJS rule: ≥ 8 chars, ≥ 1 uppercase, ≥ 1 digit. */
export const PasswordSchema = v.pipe(
  v.string(),
  v.minLength(8, 'Минимум 8 символов'),
  v.regex(/[A-ZА-Я]/, 'Должна быть хотя бы одна заглавная буква'),
  v.regex(/[0-9]/, 'Должна быть хотя бы одна цифра'),
)

/** Lighter rule for login (we only check non-empty, server validates the rest). */
export const LoginPasswordSchema = v.pipe(v.string(), v.minLength(1, 'Введите пароль'))

export const LoginSchema = v.object({
  email: EmailSchema,
  password: LoginPasswordSchema,
})

export const RegisterSchema = v.object({
  email: EmailSchema,
  password: PasswordSchema,
})

export type LoginInput = v.InferInput<typeof LoginSchema>
export type RegisterInput = v.InferInput<typeof RegisterSchema>

/* ─── Real auth (NestJS) ─────────────────────────────────────────────── */

export interface AuthResponse {
  userId: string
  isNewUser: boolean
}

/**
 * Thrown when login is blocked because the email isn't confirmed (Option A —
 * hard gate). Also raised by register when the backend creates the account
 * but withholds tokens until verification. The modal catches this and
 * switches to the verify-pending pane.
 */
export class EmailNotVerifiedError extends Error {
  readonly code = 'EMAIL_NOT_VERIFIED' as const
  constructor(public readonly email: string) {
    super('Email not verified')
    this.name = 'EmailNotVerifiedError'
  }
}

interface VerificationRequiredBody {
  code: 'EMAIL_NOT_VERIFIED' | 'VERIFICATION_REQUIRED'
  email: string
}

function isVerificationRequiredBody(body: unknown): body is VerificationRequiredBody {
  if (!body || typeof body !== 'object') return false
  const b = body as Record<string, unknown>
  return (
    (b.code === 'EMAIL_NOT_VERIFIED' || b.code === 'VERIFICATION_REQUIRED') &&
    typeof b.email === 'string'
  )
}

export async function loginWithEmail(email: string, password: string): Promise<AuthResponse> {
  const result = v.safeParse(LoginSchema, { email, password })
  if (!result.success) {
    throw new Error(result.issues[0]?.message ?? 'Проверьте данные')
  }
  const response = await apiFetch<BackendAuthResponse>('/auth/login', {
    email: result.output.email,
    password: result.output.password,
  })
  writeAuth({
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    userId: response.user.id,
  })
  return { userId: response.user.id, isNewUser: false }
}

/**
 * Register may return any of three success shapes depending on backend
 * email-verification mode:
 *   1. Tokens (legacy / dev mode — auto-login):
 *      { user, accessToken, refreshToken }
 *   2. Verification gate with body (preferred):
 *      { code: "VERIFICATION_REQUIRED", email, message? } → no tokens
 *   3. Verification gate with EMPTY body (current backend):
 *      201/204 with no payload → no tokens, fall back to the submitted
 *      email for the verify-pending UI
 * Variants 2 and 3 both surface as EmailNotVerifiedError so the modal
 * renders the verify-pending pane uniformly.
 */
type RegisterBackendResponse = BackendAuthResponse | VerificationRequiredBody | null

export async function registerWithEmail(email: string, password: string): Promise<AuthResponse> {
  const result = v.safeParse(RegisterSchema, { email, password })
  if (!result.success) {
    throw new Error(result.issues[0]?.message ?? 'Проверьте данные')
  }
  const response = await apiFetch<RegisterBackendResponse>('/auth/register', {
    email: result.output.email,
    password: result.output.password,
  })
  // Empty body OR explicit VERIFICATION_REQUIRED OR a tokenless body —
  // all mean "account created, email confirmation pending". Use the
  // email the backend echoed when available, otherwise fall back to the
  // one the user just typed.
  if (response === null || isVerificationRequiredBody(response)) {
    const verifiedAddress =
      response && isVerificationRequiredBody(response) ? response.email : result.output.email
    throw new EmailNotVerifiedError(verifiedAddress)
  }
  if (!response.accessToken || !response.user) {
    // Defensive: backend dropped tokens for some reason → treat as
    // verification-pending rather than crashing.
    throw new EmailNotVerifiedError(result.output.email)
  }
  writeAuth({
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    userId: response.user.id,
  })
  return { userId: response.user.id, isNewUser: true }
}

/**
 * Request a fresh verification email for the given address. Backend should
 * respond 200/202 regardless of whether the email exists (no enumeration)
 * and apply server-side rate limiting (60s between sends, 5/hour cap).
 * Returns the (claimed) email for UI display.
 */
export async function resendVerification(email: string): Promise<{ email: string }> {
  const result = v.safeParse(v.object({ email: EmailSchema }), { email })
  if (!result.success) {
    throw new Error(result.issues[0]?.message ?? 'Введите корректный email')
  }
  await apiFetch<{ message?: string }>('/auth/resend-verification', {
    email: result.output.email,
  })
  return { email: result.output.email }
}

/* ─── Booking (mock until backend exposes /appointments/quick-book) ──── */

export interface QuickBookInput {
  doctorId: string
  slotId: string
  email?: string
}

export interface QuickBookResult {
  appointmentId: string
  scheduledAt: string
}

export async function quickBook(input: QuickBookInput): Promise<QuickBookResult> {
  await wait(400)
  return {
    appointmentId: `a-${input.slotId}-${Date.now()}`,
    scheduledAt: new Date().toISOString(),
  }
}

/* ─── Internals ──────────────────────────────────────────────────────── */

interface ApiErrorBody {
  message?: string | string[]
  statusCode?: number
}

async function apiFetch<T>(path: string, body: unknown): Promise<T> {
  let response: Response
  try {
    response = await fetch(new URL(path, API_URL), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('Сервер недоступен. Проверьте подключение.')
  }

  if (response.ok) {
    // 204 No Content and other empty-body responses are legal — e.g. the
    // verification-gate variant of /auth/register acknowledges success
    // without echoing user data. Read the body as text and only parse if
    // there's something to parse; otherwise return null cast to T (callers
    // that depend on a real shape must defensively handle null).
    const raw = await response.text()
    if (!raw) return null as T
    try {
      return JSON.parse(raw) as T
    } catch {
      throw new Error('Сервер вернул некорректный ответ')
    }
  }

  const errBody = (await response.json().catch(() => null)) as
    | (ApiErrorBody & Partial<VerificationRequiredBody>)
    | null
  // 403 + structured verification-required body → throw the typed error so
  // the modal can switch to the verify-pending pane instead of showing
  // "Ошибка 403" in red. Backend contract: { code: "EMAIL_NOT_VERIFIED", email }
  if (response.status === 403 && errBody && isVerificationRequiredBody(errBody)) {
    throw new EmailNotVerifiedError(errBody.email)
  }
  throw new Error(formatBackendError(response.status, errBody))
}

function formatBackendError(status: number, body: ApiErrorBody | null): string {
  const msg = body?.message
  const flat = Array.isArray(msg) ? msg.join('; ') : msg
  if (flat) return flat
  if (status === 401) return 'Неверный email или пароль'
  if (status === 409) return 'Аккаунт с таким email уже существует'
  if (status === 400) return 'Проверьте email и пароль'
  if (status >= 500) return 'Сервер недоступен. Попробуйте через минуту'
  return `Ошибка ${status}`
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
