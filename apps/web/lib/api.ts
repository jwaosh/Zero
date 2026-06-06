import { cookies } from "next/headers";

const BASE = process.env.API_BASE_URL ?? "http://localhost:4000";
export const SESSION_COOKIE = "zero_session";

export function getToken(): string | undefined {
  return cookies().get(SESSION_COOKIE)?.value;
}

/** Server-side fetch to the API, attaching the session token from the cookie. */
export async function apiFetch(
  path: string,
  init: RequestInit = {},
  token?: string,
): Promise<Response> {
  const t = token ?? getToken();
  return fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
}

export const API_BASE = BASE;
