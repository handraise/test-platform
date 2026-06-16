import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const run = db.select().from(schema.runs).where(eq(schema.runs.id, id)).all()[0];
  if (!run) return NextResponse.json({ error: "run not found" }, { status: 404 });

  const steps = db
    .select()
    .from(schema.runSteps)
    .where(eq(schema.runSteps.runId, id))
    .orderBy(asc(schema.runSteps.index))
    .all();

  const test = db
    .select()
    .from(schema.tests)
    .where(eq(schema.tests.id, run.testId))
    .all()[0];

  return NextResponse.json({ run, steps, test: test ?? null });
}
