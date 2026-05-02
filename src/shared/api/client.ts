import { env } from "@/shared/config/env";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: unknown,
  ) {
    super(`API ${status} ${statusText}`);
    this.name = "ApiError";
  }
}

interface RequestOptions extends Omit<RequestInit, "body" | "headers"> {
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
  /** Bypass auth header injection + refresh interceptor (login/register/refresh endpoints). */
  skipAuth?: boolean;
}

type GetTokenFn = () => string | null;
type RefreshFn = () => Promise<string | null>;
type LogoutFn = () => void;

interface AuthAdapter {
  getAccessToken: GetTokenFn;
  refresh: RefreshFn;
  onAuthFailure: LogoutFn;
}

let authAdapter: AuthAdapter | null = null;

/**
 * Wires the api client to the auth feature without creating a circular import:
 * features/auth calls registerAuthAdapter once at app boot.
 */
export function registerAuthAdapter(adapter: AuthAdapter) {
  authAdapter = adapter;
}

export class ApiClient {
  private refreshPromise: Promise<string | null> | null = null;

  constructor(private readonly baseURL: string) {}

  private async ensureRefreshed(): Promise<string | null> {
    if (!authAdapter) return null;
    if (!this.refreshPromise) {
      this.refreshPromise = authAdapter.refresh().finally(() => {
        this.refreshPromise = null;
      });
    }
    return this.refreshPromise;
  }

  private buildHeaders(opts: RequestOptions, token: string | null): Headers {
    const headers = new Headers({
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(opts.headers ?? {}),
    });
    if (token && !opts.skipAuth) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  }

  private async send<T>(path: string, options: RequestOptions, retried: boolean): Promise<T> {
    const { params, body, headers: _h, skipAuth, ...rest } = options;

    const url = new URL(path, this.baseURL);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) url.searchParams.set(key, String(value));
      }
    }

    const token = skipAuth ? null : (authAdapter?.getAccessToken() ?? null);
    const response = await fetch(url, {
      ...rest,
      headers: this.buildHeaders(options, token),
      body: body !== undefined ? JSON.stringify(body) : null,
    });

    if (response.status === 401 && !skipAuth && !retried && authAdapter) {
      const fresh = await this.ensureRefreshed();
      if (fresh) {
        return this.send<T>(path, options, true);
      }
      authAdapter.onAuthFailure();
    }

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => null)) as unknown;
      throw new ApiError(response.status, response.statusText, errorBody);
    }

    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  private request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.send<T>(path, options, false);
  }

  get<T>(path: string, options?: Omit<RequestOptions, "body" | "method">) {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  post<T>(path: string, body?: unknown, options?: Omit<RequestOptions, "body" | "method">) {
    return this.request<T>(path, { ...options, method: "POST", body });
  }

  patch<T>(path: string, body?: unknown, options?: Omit<RequestOptions, "body" | "method">) {
    return this.request<T>(path, { ...options, method: "PATCH", body });
  }

  put<T>(path: string, body?: unknown, options?: Omit<RequestOptions, "body" | "method">) {
    return this.request<T>(path, { ...options, method: "PUT", body });
  }

  delete<T>(path: string, options?: Omit<RequestOptions, "body" | "method">) {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }
}

export const apiClient = new ApiClient(env.API_URL);
