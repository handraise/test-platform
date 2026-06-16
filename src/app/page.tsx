import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { discoverTests } from "@/lib/discovery";
import { loadScript } from "@/lib/trace";
import {
  KindBadge,
  ModeBadge,
  StatusBadge,
  formatTime,
} from "@/components/badges";
import { RunButton } from "@/components/RunButton";

export const dynamic = "force-dynamic";

export default function Home() {
  const tests = discoverTests().map((test) => {
    const lastRun = db
      .select()
      .from(schema.runs)
      .where(eq(schema.runs.testId, test.id))
      .orderBy(desc(schema.runs.startedAt))
      .limit(1)
      .all()[0];
    return { test, lastRun, cached: loadScript(test.id, test.contentHash) !== null };
  });

  const passed = tests.filter((t) => t.lastRun?.status === "passed").length;
  const failed = tests.filter(
    (t) => t.lastRun && t.lastRun.status !== "passed" && t.lastRun.status !== "running",
  ).length;

  return (
    <div className="space-y-8">
      <section className="rise flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tests</h1>
          <p className="text-dim text-[13px] mt-1">
            Plain-English specs, executed by AI, replayed deterministically.
          </p>
        </div>
        <div className="flex gap-6 text-[13px] text-dim">
          <span>
            <span className="text-ink font-medium">{tests.length}</span> tests
          </span>
          <span>
            <span className="text-green font-medium">{passed}</span> passing
          </span>
          <span>
            <span className={`font-medium ${failed ? "text-red" : "text-ink"}`}>
              {failed}
            </span>{" "}
            failing
          </span>
        </div>
      </section>

      <section
        className="rounded-xl border border-line bg-panel overflow-hidden rise"
        style={{ animationDelay: "60ms" }}
      >
        {tests.length === 0 && (
          <p className="px-5 py-12 text-dim text-[13px] text-center">
            No tests found. Add{" "}
            <code className="font-[family-name:var(--font-mono)] text-ink">
              *.test.md
            </code>{" "}
            files to{" "}
            <code className="font-[family-name:var(--font-mono)] text-ink">tests/</code>.
          </p>
        )}
        {tests.map(({ test, lastRun, cached }, i) => (
          <div
            key={test.id}
            className="flex items-center gap-6 px-5 py-4 border-b border-line last:border-b-0 hover:bg-panel-2/60 transition-colors rise"
            style={{ animationDelay: `${90 + i * 30}ms` }}
          >
            <div className="min-w-0 flex-1">
              <Link
                href={`/tests/${test.id}`}
                className="text-[14px] font-medium hover:underline underline-offset-4 inline-flex items-center gap-2"
              >
                {test.name}
                <KindBadge kind={test.kind} />
              </Link>
              <p className="text-[12px] text-dim truncate mt-0.5 font-[family-name:var(--font-mono)]">
                {test.path} ·{" "}
                {test.kind === "playwright"
                  ? `${test.steps.length} test${test.steps.length === 1 ? "" : "s"}`
                  : `${test.steps.length} steps`}
              </p>
            </div>
            <span
              className={`text-[12px] hidden sm:inline ${cached ? "text-dim" : "text-faint"}`}
              title={
                test.kind === "playwright"
                  ? "Runs via the Playwright test runner"
                  : cached
                    ? "Cached script — next run replays without AI"
                    : "No cached script — next run uses AI"
              }
            >
              {test.kind === "playwright"
                ? "spec"
                : cached
                  ? "cached"
                  : "no script"}
            </span>
            <div className="w-48 hidden md:block">
              {lastRun ? (
                <Link href={`/runs/${lastRun.id}`} className="inline-flex items-center gap-2">
                  <StatusBadge status={lastRun.status} />
                  <ModeBadge mode={lastRun.mode} />
                </Link>
              ) : (
                <span className="text-faint text-[12px]">never run</span>
              )}
              {lastRun && (
                <p className="text-[11px] text-faint mt-1">{formatTime(lastRun.startedAt)}</p>
              )}
            </div>
            <RunButton testId={test.id} size="sm" />
          </div>
        ))}
      </section>
    </div>
  );
}
