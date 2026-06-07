import { NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";

// Proxy for the web button-press simulator. Forwards a press to the REAL device
// ingest endpoint (POST /api/events) using the device's bearer token — exactly
// the path the ESP32 firmware takes. So the press lands with source="button",
// device_id set, and last_seen_at bumped, unlike the manual /api/events/manual
// route. The token is supplied per-request by the client (kept in localStorage),
// never stored server-side.
export async function POST(req: Request) {
  const { button, token } = (await req.json()) as {
    button?: unknown;
    token?: unknown;
  };

  if (typeof token !== "string" || !token) {
    return NextResponse.json({ error: "device token required" }, { status: 400 });
  }
  if (button !== 1 && button !== 2) {
    return NextResponse.json({ error: "button must be 1 or 2" }, { status: 400 });
  }

  // Bearer auth with the device token (third arg overrides the session cookie).
  const res = await apiFetch(
    "/api/events",
    { method: "POST", body: JSON.stringify({ button }) },
    token,
  );

  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
