import { NextResponse } from "next/server";
import { apiFetch, SESSION_COOKIE } from "@/lib/api";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

export async function POST(req: Request) {
  const body = await req.json();
  const res = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json(
      { error: data.error ?? "login failed" },
      { status: res.status },
    );
  }

  const out = NextResponse.json({ ok: true });
  out.cookies.set(SESSION_COOKIE, data.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: THIRTY_DAYS,
  });
  return out;
}

export async function DELETE() {
  const out = NextResponse.json({ ok: true });
  out.cookies.delete(SESSION_COOKIE);
  return out;
}
