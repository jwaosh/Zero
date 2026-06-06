import { NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";

export async function POST(req: Request) {
  const body = await req.json();
  const res = await apiFetch("/api/events/manual", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
