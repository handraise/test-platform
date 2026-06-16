import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Liveness/readiness probe target for Kubernetes. */
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
