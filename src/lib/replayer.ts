import fs from "node:fs";
import path from "node:path";
import { BrowserSession } from "./browser";
import { CachedScript, checkExpect } from "./trace";
import { ExecutorCallbacks } from "./executor";

export interface ReplayResult {
  status: "passed" | "failed";
  failedStepIndex?: number;
  error?: string;
}

/**
 * Replay a cached script deterministically — no AI involved.
 * Step boundaries come from each entry's stepIndex; a step passes when all
 * of its commands succeed (and any `expect` comparisons hold).
 */
export async function replayScript(opts: {
  script: CachedScript;
  browser: BrowserSession;
  runId: string;
  callbacks: ExecutorCallbacks;
}): Promise<ReplayResult> {
  const { script, browser, runId, callbacks } = opts;
  const screenshotDir = path.join(process.cwd(), "data", "screenshots", runId);
  fs.mkdirSync(screenshotDir, { recursive: true });

  let currentStep = 0;

  const finishStep = async (stepIndex: number) => {
    if (stepIndex <= 0) return;
    const file = path.join(screenshotDir, `step-${stepIndex}-replay.png`);
    const shot = await browser.run(["screenshot", file]);
    callbacks.onStep(
      stepIndex,
      "passed",
      "replayed from cached script",
      shot.ok ? path.relative(process.cwd(), file) : undefined,
    );
  };

  for (const entry of script.entries) {
    if (entry.stepIndex !== currentStep) {
      await finishStep(currentStep);
      currentStep = entry.stepIndex;
      if (currentStep > 0) callbacks.onStep(currentStep, "running");
    }

    const result = await browser.run(entry.argv, 45_000);
    if (!result.ok) {
      const error = `Command \`${entry.argv.join(" ")}\` failed: ${result.output}`;
      if (currentStep > 0) callbacks.onStep(currentStep, "failed", error);
      return { status: "failed", failedStepIndex: currentStep, error };
    }

    if (entry.expect) {
      const payload = (result.data as { data?: unknown } | undefined)?.data;
      const { ok, actual } = checkExpect(payload, entry.expect);
      if (!ok) {
        const error = `Expected ${entry.expect.field} to ${entry.expect.kind} "${entry.expect.value}" but got "${actual}"`;
        if (currentStep > 0) callbacks.onStep(currentStep, "failed", error);
        return { status: "failed", failedStepIndex: currentStep, error };
      }
    }
  }

  await finishStep(currentStep);
  return { status: "passed" };
}
