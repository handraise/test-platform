import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { discoverTests } from "@/lib/discovery";
import { db, schema } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const tests = discoverTests();
  const withStatus = tests.map((test) => {
    const lastRun = db
      .select()
      .from(schema.runs)
      .where(eq(schema.runs.testId, test.id))
      .orderBy(desc(schema.runs.startedAt))
      .limit(1)
      .all()[0];
    return { ...test, lastRun: lastRun ?? null };
  });
  return NextResponse.json(withStatus);
}
