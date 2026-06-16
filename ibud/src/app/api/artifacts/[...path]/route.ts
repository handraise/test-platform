import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = {
  ".webm": "video/webm",
  ".zip": "application/zip",
  ".png": "image/png",
};

/** Serve Playwright artifacts (video, trace zip) from data/artifacts. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: parts } = await params;
  const base = path.join(process.cwd(), "data", "artifacts");
  const file = path.join(base, ...parts);

  // Prevent path traversal outside the artifacts dir.
  if (!path.resolve(file).startsWith(path.resolve(base) + path.sep)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!fs.existsSync(file)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const ext = path.extname(file).toLowerCase();
  return new NextResponse(new Uint8Array(fs.readFileSync(file)), {
    headers: {
      "Content-Type": TYPES[ext] ?? "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
      // Allow trace.playwright.dev to fetch a trace.zip by URL.
      "Access-Control-Allow-Origin": "*",
    },
  });
}
