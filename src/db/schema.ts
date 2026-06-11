import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const tests = sqliteTable("tests", {
  id: text("id").primaryKey(), // hash of file path
  path: text("path").notNull().unique(),
  name: text("name").notNull(),
  // "ai" = English .test.md driven by the agent; "playwright" = *.spec.ts
  kind: text("kind", { enum: ["ai", "playwright"] })
    .notNull()
    .default("ai"),
  contentHash: text("content_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const runs = sqliteTable("runs", {
  id: text("id").primaryKey(),
  testId: text("test_id").notNull(),
  // how the run executed: replay (cached script), ai (first run), healed (replay failed → AI fixed)
  mode: text("mode", {
    enum: ["replay", "ai", "healed", "playwright"],
  }).notNull(),
  status: text("status", {
    enum: ["running", "passed", "failed", "error"],
  }).notNull(),
  startedAt: integer("started_at", { mode: "timestamp_ms" }).notNull(),
  finishedAt: integer("finished_at", { mode: "timestamp_ms" }),
  error: text("error"),
  tokensUsed: integer("tokens_used"),
});

export const runSteps = sqliteTable("run_steps", {
  id: text("id").primaryKey(),
  runId: text("run_id").notNull(),
  index: integer("index").notNull(),
  instruction: text("instruction").notNull(),
  status: text("status", {
    enum: ["pending", "running", "passed", "failed"],
  }).notNull(),
  note: text("note"),
  screenshotPath: text("screenshot_path"),
  durationMs: integer("duration_ms"),
});

export type Test = typeof tests.$inferSelect;
export type Run = typeof runs.$inferSelect;
export type RunStep = typeof runSteps.$inferSelect;
