import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, schema } from "../db";
import { BrowserSession } from "./browser";
import { TestFile } from "./discovery";
import { emitRunEvent } from "./events";
import { ExecutorCallbacks, runAiExecutor } from "./executor";
import { replayScript } from "./replayer";
import { runPlaywright } from "./playwright";
import { loadScript, saveScript } from "./trace";
import { loadConfig } from "./config";

export type RunMode = "replay" | "ai" | "healed" | "playwright";

/** Runs execute in-process, so at server start nothing can still be running —
 *  any leftover "running" rows are from a crash/rollout mid-run. Mark them errored. */
export function reconcileOrphanedRuns(): void {
  const res = db
    .update(schema.runs)
    .set({ status: "error", error: "Interrupted (server restarted)", finishedAt: new Date() })
    .where(eq(schema.runs.status, "running"))
    .run();
  db.update(schema.runSteps)
    .set({ status: "failed", note: "interrupted" })
    .where(eq(schema.runSteps.status, "running"))
    .run();
  if (res.changes > 0) console.log(`reconciled ${res.changes} orphaned run(s)`);
}

/** Create the run + step rows and kick off execution in the background. */
export function startRun(test: TestFile): string {
  const runId = nanoid(10);
  const now = new Date();

  db.insert(schema.tests)
    .values({
      id: test.id,
      path: test.path,
      name: test.name,
      kind: test.kind,
      contentHash: test.contentHash,
      createdAt: now,
    })
    .onConflictDoUpdate({
      target: schema.tests.id,
      set: { name: test.name, kind: test.kind, contentHash: test.contentHash },
    })
    .run();

  const initialMode: RunMode =
    test.kind === "playwright"
      ? "playwright"
      : loadScript(test.id, test.contentHash) !== null
        ? "replay"
        : "ai";

  db.insert(schema.runs)
    .values({
      id: runId,
      testId: test.id,
      mode: initialMode,
      status: "running",
      startedAt: now,
    })
    .run();

  db.insert(schema.runSteps)
    .values(
      test.steps.map((instruction, i) => ({
        id: `${runId}-${i + 1}`,
        runId,
        index: i + 1,
        instruction,
        status: "pending" as const,
      })),
    )
    .run();

  // Fire and forget — progress is observable via the event bus / DB.
  void executeRun(runId, test, initialMode).catch((err) => {
    finishRun(runId, "error", initialMode, String(err));
  });

  return runId;
}

function makeCallbacks(runId: string): ExecutorCallbacks {
  return {
    onStep: (stepIndex, status, note, screenshotPath, artifacts) => {
      db.update(schema.runSteps)
        .set({
          status: status === "running" ? "running" : status,
          note: note ?? null,
          ...(screenshotPath ? { screenshotPath } : {}),
          ...(artifacts?.tracePath ? { tracePath: artifacts.tracePath } : {}),
          ...(artifacts?.videoPath ? { videoPath: artifacts.videoPath } : {}),
        })
        .where(eq(schema.runSteps.id, `${runId}-${stepIndex}`))
        .run();
      emitRunEvent({
        type: "step_update",
        runId,
        stepIndex,
        status,
        note,
        screenshotPath,
        tracePath: artifacts?.tracePath,
        videoPath: artifacts?.videoPath,
      });
    },
    onNote: (text) => emitRunEvent({ type: "agent_note", runId, text }),
  };
}

function finishRun(
  runId: string,
  status: "passed" | "failed" | "error",
  mode: RunMode,
  error?: string,
  tokensUsed?: number,
) {
  db.update(schema.runs)
    .set({
      status,
      mode,
      finishedAt: new Date(),
      error: error ?? null,
      tokensUsed: tokensUsed ?? null,
    })
    .where(eq(schema.runs.id, runId))
    .run();
  emitRunEvent({ type: "run_finished", runId, status, mode, error });
}

async function executeRun(runId: string, test: TestFile, initialMode: RunMode) {
  const config = loadConfig();
  const browser = new BrowserSession(`ibud-${runId}`, config.headless);
  const callbacks = makeCallbacks(runId);
  let mode: RunMode = initialMode;

  emitRunEvent({ type: "run_started", runId, testId: test.id, mode });

  // Playwright specs run through the Playwright CLI, not the AI/replay loop.
  if (test.kind === "playwright") {
    try {
      const result = await runPlaywright({ test, runId, callbacks });
      finishRun(runId, result.status, "playwright", result.reason);
    } finally {
      // no agent-browser session was opened for playwright runs
    }
    return;
  }

  try {
    const script = loadScript(test.id, test.contentHash);

    // Fast path: deterministic replay of the cached script.
    if (script) {
      const replay = await replayScript({ script, browser, runId, callbacks });
      if (replay.status === "passed") {
        finishRun(runId, "passed", "replay");
        return;
      }

      // Replay broke — the app likely changed. Re-engage the AI to heal.
      mode = "healed";
      emitRunEvent({
        type: "agent_note",
        runId,
        text: `Replay failed at step ${replay.failedStepIndex}: ${replay.error}. Healing with AI...`,
      });
      resetSteps(runId);
      const healed = await runAiExecutor({
        test,
        browser,
        runId,
        callbacks,
        heal: {
          failedStepIndex: replay.failedStepIndex ?? 0,
          error: replay.error ?? "unknown",
        },
      });
      if (healed.status === "passed") {
        saveScript({
          testId: test.id,
          contentHash: test.contentHash,
          recordedAt: new Date().toISOString(),
          entries: healed.entries,
        });
      }
      finishRun(runId, healed.status, "healed", healed.reason, healed.tokensUsed);
      return;
    }

    // First run (or stale script): AI executes and records.
    const result = await runAiExecutor({ test, browser, runId, callbacks });
    if (result.status === "passed") {
      saveScript({
        testId: test.id,
        contentHash: test.contentHash,
        recordedAt: new Date().toISOString(),
        entries: result.entries,
      });
    }
    finishRun(runId, result.status, "ai", result.reason, result.tokensUsed);
  } finally {
    await browser.close();
  }
}

function resetSteps(runId: string) {
  db.update(schema.runSteps)
    .set({ status: "pending", note: null, screenshotPath: null })
    .where(eq(schema.runSteps.runId, runId))
    .run();
}
