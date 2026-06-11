import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import matter from "gray-matter";
import { loadConfig } from "./config";

export type TestKind = "ai" | "playwright";

export interface TestFile {
  id: string;
  path: string;
  name: string;
  kind: TestKind;
  /** Start URL for AI tests (relative to baseUrl or absolute); "" for specs. */
  url: string;
  tags: string[];
  /** AI: numbered English steps. Playwright: the test() titles in the file. */
  steps: string[];
  contentHash: string;
}

function sha(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function relId(filePath: string): { rel: string; id: string } {
  const rel = path.relative(process.cwd(), filePath);
  return { rel, id: sha(rel).slice(0, 12) };
}

/** Parse an English markdown test (*.test.md). */
export function parseTestFile(filePath: string): TestFile {
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);

  const steps = content
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^\d+[.)]\s+/.test(l))
    .map((l) => l.replace(/^\d+[.)]\s+/, ""));

  const { rel, id } = relId(filePath);
  return {
    id,
    path: rel,
    name: (data.name as string) ?? path.basename(filePath, ".test.md"),
    kind: "ai",
    url: (data.url as string) ?? "/",
    tags: (data.tags as string[]) ?? [],
    steps,
    contentHash: sha(raw).slice(0, 16),
  };
}

/** Parse a Playwright spec (*.spec.ts): each test() title becomes a step. */
export function parseSpecFile(filePath: string): TestFile {
  const raw = fs.readFileSync(filePath, "utf8");

  // Grab titles from test('...') / test("...") / test(`...`), skipping test.describe/skip helpers.
  const titles: string[] = [];
  const re = /\btest(?:\.only|\.fixme)?\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) titles.push(m[2]);

  const { rel, id } = relId(filePath);
  return {
    id,
    path: rel,
    name: path.basename(filePath, ".spec.ts"),
    kind: "playwright",
    url: "",
    tags: ["playwright"],
    steps: titles.length ? titles : ["Run spec"],
    contentHash: sha(raw).slice(0, 16),
  };
}

export function discoverTests(): TestFile[] {
  const config = loadConfig();
  const dir = path.join(process.cwd(), config.testDir);
  if (!fs.existsSync(dir)) return [];

  const names = fs.readdirSync(dir, { recursive: true, encoding: "utf8" });

  const ai = names
    .filter((f) => f.endsWith(".test.md"))
    .map((f) => parseTestFile(path.join(dir, f)));

  const playwright = names
    .filter((f) => f.endsWith(".spec.ts"))
    .map((f) => parseSpecFile(path.join(dir, f)));

  return [...ai, ...playwright].sort((a, b) => a.name.localeCompare(b.name));
}

export function getTestById(id: string): TestFile | undefined {
  return discoverTests().find((t) => t.id === id);
}

export function resolveStartUrl(test: TestFile): string {
  if (/^https?:\/\//.test(test.url)) return test.url;
  const base = loadConfig().baseUrl.replace(/\/$/, "");
  return base + (test.url.startsWith("/") ? test.url : `/${test.url}`);
}
