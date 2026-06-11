import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { TestFile } from "./discovery";
import { ExecutorCallbacks } from "./executor";

const PREFIX = "@@IBUD@@";

export interface PlaywrightResult {
  status: "passed" | "failed";
  reason?: string;
}

interface PwEvent {
  type: "begin" | "testBegin" | "testEnd" | "end";
  title?: string;
  status?: string;
  durationMs?: number;
  error?: string;
  screenshot?: string;
  total?: number;
}

/**
 * Run a Playwright spec via the CLI with our NDJSON reporter, mapping each
 * test() in the file to a run step (matched to pre-created steps by title,
 * falling back to order). Streams status + screenshots as they complete.
 */
export async function runPlaywright(opts: {
  test: TestFile;
  runId: string;
  callbacks: ExecutorCallbacks;
}): Promise<PlaywrightResult> {
  const { test, runId, callbacks } = opts;
  const screenshotDir = path.join(process.cwd(), "data", "screenshots", runId);
  fs.mkdirSync(screenshotDir, { recursive: true });

  // Map test title -> 1-based step index (steps were pre-created from titles).
  const stepIndexByTitle = new Map<string, number>();
  test.steps.forEach((title, i) => stepIndexByTitle.set(title, i + 1));
  let order = 0;

  const reporter = path.join(process.cwd(), "scripts", "pw-reporter.cjs");
  const bin = path.join(process.cwd(), "node_modules", ".bin", "playwright");

  return new Promise((resolve) => {
    const child = spawn(
      bin,
      ["test", test.path, `--reporter=${reporter}`],
      { cwd: process.cwd(), env: { ...process.env, FORCE_COLOR: "0" } },
    );

    let buffer = "";
    let failures = 0;
    const errors: string[] = [];

    const handleEvent = (evt: PwEvent) => {
      if (evt.type === "testBegin" && evt.title) {
        const idx = stepIndexByTitle.get(evt.title) ?? order + 1;
        callbacks.onStep(idx, "running");
      } else if (evt.type === "testEnd" && evt.title) {
        order += 1;
        const idx = stepIndexByTitle.get(evt.title) ?? order;
        const passed = evt.status === "passed";
        if (!passed) {
          failures += 1;
          if (evt.error) errors.push(`${evt.title}: ${evt.error}`);
        }

        let screenshotPath: string | undefined;
        if (evt.screenshot && fs.existsSync(evt.screenshot)) {
          const dest = path.join(screenshotDir, `step-${idx}.png`);
          try {
            fs.copyFileSync(evt.screenshot, dest);
            screenshotPath = path.relative(process.cwd(), dest);
          } catch {
            // ignore copy failures
          }
        }

        callbacks.onStep(
          idx,
          passed ? "passed" : "failed",
          passed
            ? `${evt.status} · ${Math.round((evt.durationMs ?? 0) / 100) / 10}s`
            : (evt.error ?? evt.status),
          screenshotPath,
        );
      }
    };

    const consume = (chunk: string) => {
      buffer += chunk;
      let nl: number;
      while ((nl = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 1);
        const at = line.indexOf(PREFIX);
        if (at >= 0) {
          try {
            handleEvent(JSON.parse(line.slice(at + PREFIX.length)) as PwEvent);
          } catch {
            // ignore malformed line
          }
        } else if (line.trim()) {
          callbacks.onNote(line.trim().slice(0, 300));
        }
      }
    };

    child.stdout.on("data", (d) => consume(d.toString()));
    child.stderr.on("data", (d) => consume(d.toString()));

    child.on("close", (code) => {
      const passed = code === 0 && failures === 0;
      resolve({
        status: passed ? "passed" : "failed",
        reason: passed
          ? undefined
          : errors.length
            ? errors.join("\n")
            : `playwright exited with code ${code}`,
      });
    });

    child.on("error", (err) => {
      resolve({ status: "failed", reason: String(err) });
    });
  });
}
