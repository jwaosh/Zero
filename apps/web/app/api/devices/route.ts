import { NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";

export async function GET() {
  const res = await apiFetch("/api/devices");
  return NextResponse.json(await res.json(), { status: res.status });
}

export async function POST(req: Request) {
  const body = await req.json();
  const res = await apiFetch("/api/devices", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
