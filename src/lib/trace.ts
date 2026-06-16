import fs from "node:fs";
import path from "node:path";

/**
 * One recorded agent-browser invocation. For action/wait commands the
 * command's own success is the verdict on replay. `expect` adds a value
 * comparison against a field of the JSON `data` payload (e.g. get text).
 */
export interface TraceEntry {
  stepIndex: number;
  argv: string[];
  expect?: {
    field: string; // key inside the JSON `data` object, e.g. "text" | "url"
    kind: "contains" | "equals";
    value: string;
  };
}

export interface CachedScript {
  testId: string;
  contentHash: string;
  recordedAt: string;
  entries: TraceEntry[];
}

function scriptPath(testId: string): string {
  return path.join(process.cwd(), "data", "scripts", `${testId}.json`);
}

export function loadScript(testId: string, contentHash: string): CachedScript | null {
  const file = scriptPath(testId);
  if (!fs.existsSync(file)) return null;
  const script = JSON.parse(fs.readFileSync(file, "utf8")) as CachedScript;
  // A stale script (test file edited since recording) must not be replayed.
  return script.contentHash === contentHash ? script : null;
}

export function saveScript(script: CachedScript): void {
  const file = scriptPath(script.testId);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(script, null, 2));
}

export function checkExpect(
  data: unknown,
  expect: NonNullable<TraceEntry["expect"]>,
): { ok: boolean; actual: string } {
  const actual = String(
    (data as Record<string, unknown> | null)?.[expect.field] ?? "",
  );
  const ok =
    expect.kind === "contains"
      ? actual.includes(expect.value)
      : actual === expect.value;
  return { ok, actual };
}
