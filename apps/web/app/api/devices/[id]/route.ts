import { NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const res = await apiFetch(`/api/devices/${params.id}`, { method: "DELETE" });
  return NextResponse.json(await res.json(), { status: res.status });
}
