import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getTestById, resolveStartUrl } from "@/lib/discovery";
import { loadScript } from "@/lib/trace";
import {
  KindBadge,
  ModeBadge,
  StatusBadge,
  formatDuration,
  formatTime,
} from "@/components/badges";
import { RunButton } from "@/components/RunButton";

export const dynamic = "force-dynamic";

export default async function TestDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const test = getTestById(id);
  if (!test) notFound();

  const runs = db
    .select()
    .from(schema.runs)
    .where(eq(schema.runs.testId, id))
    .orderBy(desc(schema.runs.startedAt))
    .limit(50)
    .all();

  const script = loadScript(test.id, test.contentHash);

  return (
    <div className="space-y-8">
      <section className="rise">
        <p className="text-[13px] text-dim mb-3">
          <Link href="/" className="hover:text-ink transition-colors">
            Tests
          </Link>{" "}
          <span className="text-faint">/</span>{" "}
          <span className="font-[family-name:var(--font-mono)]">{test.path}</span>
        </p>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-3">
            {test.name}
            <KindBadge kind={test.kind} />
          </h1>
          <RunButton testId={test.id} />
        </div>
        <p className="text-dim text-[13px] mt-2">
          {test.kind === "playwright" ? (
            <span>
              Playwright spec ·{" "}
              <span className="font-[family-name:var(--font-mono)]">{test.path}</span>{" "}
              · driven via agent-browser&apos;s Chrome
            </span>
          ) : (
            <>
              <span className="font-[family-name:var(--font-mono)]">
                {resolveStartUrl(test)}
              </span>
              {" · "}
              {script ? (
                <span>cached script · {script.entries.length} commands</span>
              ) : (
                <span className="text-faint">no cached script — next run uses AI</span>
              )}
            </>
          )}
        </p>
      </section>

      <section
        className="grid md:grid-cols-2 gap-6 rise"
        style={{ animationDelay: "60ms" }}
      >
        <div className="rounded-xl border border-line bg-panel overflow-hidden">
          <p className="text-[12px] font-medium text-dim px-5 py-2.5 border-b border-line">
            {test.kind === "playwright" ? "Tests in this spec" : "Steps"}
          </p>
          <ol className="p-5 space-y-3">
            {test.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-[13px]">
                <span className="text-faint w-5 text-right shrink-0 font-[family-name:var(--font-mono)]">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-xl border border-line bg-panel overflow-hidden">
          <p className="text-[12px] font-medium text-dim px-5 py-2.5 border-b border-line">
            Run history
          </p>
          {runs.length === 0 && (
            <p className="px-5 py-10 text-dim text-[13px]">No runs yet.</p>
          )}
          <div>
            {runs.map((run) => (
              <Link
                key={run.id}
                href={`/runs/${run.id}`}
                className="flex items-center justify-between gap-3 px-5 py-3 border-b border-line last:border-b-0 hover:bg-panel-2/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <StatusBadge status={run.status} />
                  <ModeBadge mode={run.mode} />
                </div>
                <div className="text-right">
                  <p className="text-[12px] text-dim">{formatTime(run.startedAt)}</p>
                  <p className="text-[11px] text-faint">
                    {formatDuration(run.startedAt, run.finishedAt)}
                    {run.tokensUsed ? ` · ${run.tokensUsed.toLocaleString()} tok` : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
