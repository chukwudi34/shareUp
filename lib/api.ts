import { cookies } from "next/headers";

export const API_URL = process.env.SHAREUP_API_URL ?? "http://127.0.0.1:8000";
export const TOKEN_COOKIE = "shareup_token";

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

interface ApiFetchOptions extends RequestInit {
  token?: string | null;
}

/**
 * Server-side call to the Laravel API. Never called from the browser, so the
 * bearer token stays inside the httpOnly cookie and Next's server runtime.
 */
export async function apiFetch<T>(
  path: string,
  { token, headers, ...init }: ApiFetchOptions = {}
): Promise<T> {
  const bearer = token ?? (await cookies()).get(TOKEN_COOKIE)?.value;
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;

  const response = await fetch(`${API_URL}/api/${path.replace(/^\/+/, "")}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(init.body && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      ...(headers as Record<string, string> | undefined),
    },
  });

  const text = await response.text();
  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const body = payload as { message?: string; code?: string } | null;
    throw new ApiError(body?.message ?? "Something went wrong. Please try again.", response.status, body?.code);
  }

  return payload as T;
}

export async function getSessionUser() {
  try {
    const data = await apiFetch<{ user: import("./types").User }>("auth/me");
    return data.user;
  } catch {
    return null;
  }
}
