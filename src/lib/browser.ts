import { execFile } from "node:child_process";
import path from "node:path";

const BIN = path.join(process.cwd(), "node_modules", ".bin", "agent-browser");

export interface BrowserResult {
  ok: boolean;
  /** Raw stdout (or stderr on failure). */
  output: string;
  /** Parsed JSON payload when the command emitted JSON. */
  data?: unknown;
  durationMs: number;
}

/**
 * Thin wrapper around the locally-installed agent-browser CLI.
 * Each instance is bound to an isolated daemon session (`--session`),
 * so concurrent test runs never share a browser.
 */
export class BrowserSession {
  constructor(
    readonly sessionName: string,
    readonly headless: boolean = true,
  ) {}

  async run(args: string[], timeoutMs = 60_000): Promise<BrowserResult> {
    const fullArgs = [...args, "--session", this.sessionName, "--json"];
    if (!this.headless) fullArgs.push("--headed");
    const started = Date.now();

    return new Promise((resolve) => {
      execFile(
        BIN,
        fullArgs,
        { timeout: timeoutMs, maxBuffer: 16 * 1024 * 1024 },
        (error, stdout, stderr) => {
          const output = (stdout || stderr || "").trim();
          let data: unknown;
          try {
            data = JSON.parse(output);
          } catch {
            // not all commands emit JSON; keep raw text
          }
          resolve({
            ok: !error,
            output: error && !output ? String(error.message) : output,
            data,
            durationMs: Date.now() - started,
          });
        },
      );
    });
  }

  async close(): Promise<void> {
    await this.run(["close"]).catch(() => {});
  }
}
