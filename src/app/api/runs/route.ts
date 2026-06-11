import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getTestById } from "@/lib/discovery";
import { startRun } from "@/lib/runner";
import { db, schema } from "@/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { testId } = (await req.json()) as { testId?: string };
  if (!testId) {
    return NextResponse.json({ error: "testId required" }, { status: 400 });
  }
  const test = getTestById(testId);
  if (!test) {
    return NextResponse.json({ error: "test not found" }, { status: 404 });
  }
  const runId = startRun(test);
  return NextResponse.json({ runId }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const testId = req.nextUrl.searchParams.get("testId");
  const rows = testId
    ? db
        .select()
        .from(schema.runs)
        .where(eq(schema.runs.testId, testId))
        .orderBy(desc(schema.runs.startedAt))
        .limit(50)
        .all()
    : db.select().from(schema.runs).orderBy(desc(schema.runs.startedAt)).limit(50).all();
  return NextResponse.json(rows);
}
