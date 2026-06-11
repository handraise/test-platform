import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { BrowserSession } from "./browser";
import { TestFile, resolveStartUrl } from "./discovery";
import { TraceEntry, checkExpect } from "./trace";
import { resolveVars } from "./env";

const MODEL = "claude-opus-4-8";

const SYSTEM_PROMPT = `You are iBud, an expert end-to-end test executor. You receive a test written in plain English and you execute it against a real browser using the provided tools, then verify every expectation.

Workflow for EACH numbered step, in order:
1. Call report_step with status "running".
2. Use snapshot to understand the page when needed (it returns an accessibility tree).
3. Perform the step with act / find_act / wait, or verify it with assert if the step is an expectation ("Expect ...").
4. Call report_step with status "passed" or "failed" and a one-line note.

Rules:
- Execute steps strictly in order. Never skip a step. Never mark a step passed without performing/verifying it.
- For actions, use CSS selectors (e.g. #user-name, [data-test="login-button"]) or find_act with semantic locators. NEVER use @e snapshot refs in act — your successful actions are recorded and replayed later without AI, and refs do not survive replay.
- Prefer stable selectors: data-test/data-testid attributes, IDs, then semantic locators (role + name).
- If an action or assertion fails, take a fresh snapshot and retry with a different selector (up to 2 retries) before marking the step failed.
- If a step fails, still call report_step with "failed", then call finish with status "failed". Do not continue to later steps.
- After all steps pass, call finish with status "passed".
- Keep notes terse. Do not narrate between tool calls.`;

export interface ExecutorCallbacks {
  onStep: (
    stepIndex: number,
    status: "running" | "passed" | "failed",
    note?: string,
    screenshotPath?: string,
  ) => void;
  onNote: (text: string) => void;
}

export interface ExecutorResult {
  status: "passed" | "failed";
  reason?: string;
  entries: TraceEntry[];
  tokensUsed: number;
}

export interface HealContext {
  failedStepIndex: number;
  error: string;
}

export async function runAiExecutor(opts: {
  test: TestFile;
  browser: BrowserSession;
  runId: string;
  callbacks: ExecutorCallbacks;
  heal?: HealContext;
}): Promise<ExecutorResult> {
  const { test, browser, runId, callbacks, heal } = opts;
  const client = new Anthropic();
  const entries: TraceEntry[] = [];
  let finished: { status: "passed" | "failed"; reason?: string } | null = null;
  let screenshotSeq = 0;

  const screenshotDir = path.join(process.cwd(), "data", "screenshots", runId);
  fs.mkdirSync(screenshotDir, { recursive: true });

  // Open the start URL before handing control to the model; record it.
  const startUrl = resolveStartUrl(test);
  const opened = await browser.run(["open", startUrl], 90_000);
  if (!opened.ok) {
    return {
      status: "failed",
      reason: `Could not open ${startUrl}: ${opened.output}`,
      entries,
      tokensUsed: 0,
    };
  }
  entries.push({ stepIndex: 0, argv: ["open", startUrl] });

  const takeScreenshot = async (stepIndex: number): Promise<string | undefined> => {
    const file = path.join(
      screenshotDir,
      `step-${stepIndex}-${++screenshotSeq}.png`,
    );
    const res = await browser.run(["screenshot", file]);
    return res.ok ? path.relative(process.cwd(), file) : undefined;
  };

  const resultText = (r: { ok: boolean; output: string }) =>
    r.ok ? r.output : `ERROR: ${r.output}`;

  const tools = [
    betaZodTool({
      name: "snapshot",
      description:
        "Get the current page accessibility tree (interactive elements, compact). Use to understand the page before acting.",
      inputSchema: z.object({}),
      run: async () => {
        const r = await browser.run(["snapshot", "-i", "-c"]);
        return resultText(r);
      },
    }),
    betaZodTool({
      name: "act",
      description:
        "Perform a browser action on a CSS selector. Recorded for deterministic replay — never pass @e refs.",
      inputSchema: z.object({
        step: z.number().describe("1-based index of the test step this serves"),
        kind: z.enum([
          "click",
          "dblclick",
          "fill",
          "type",
          "press",
          "select",
          "check",
          "uncheck",
          "hover",
          "scroll",
        ]),
        selector: z
          .string()
          .optional()
          .describe("CSS selector. Required for all kinds except press/scroll."),
        value: z
          .string()
          .optional()
          .describe(
            "Text for fill/type, key for press (e.g. Enter), option for select, direction (up/down) for scroll",
          ),
      }),
      run: async ({ step, kind, selector, value }) => {
        if (selector?.startsWith("@")) {
          return "ERROR: @refs are not allowed in act. Use a CSS selector or find_act.";
        }
        const argv: string[] = [kind];
        if (kind === "press" || kind === "scroll") {
          argv.push(value ?? "");
        } else {
          if (!selector) return "ERROR: selector is required for this action";
          argv.push(selector);
          if (kind === "fill" || kind === "type" || kind === "select")
            argv.push(value ?? "");
        }
        const r = await browser.run(argv);
        if (r.ok) entries.push({ stepIndex: step, argv });
        return resultText(r);
      },
    }),
    betaZodTool({
      name: "find_act",
      description:
        "Perform an action using a semantic locator (more stable than CSS when no good selector exists). E.g. locator=role, locatorValue=button, name=Login, action=click.",
      inputSchema: z.object({
        step: z.number().describe("1-based index of the test step this serves"),
        locator: z.enum(["role", "text", "label", "placeholder", "testid"]),
        locatorValue: z
          .string()
          .describe("Role name (button), visible text, label text, placeholder or testid value"),
        action: z.enum(["click", "fill", "type", "hover", "check", "uncheck", "focus"]),
        actionValue: z.string().optional().describe("Text for fill/type"),
        name: z
          .string()
          .optional()
          .describe("Accessible-name filter, only with locator=role"),
      }),
      run: async ({ step, locator, locatorValue, action, actionValue, name }) => {
        const argv = ["find", locator, locatorValue, action];
        if (actionValue !== undefined) argv.push(actionValue);
        if (name) argv.push("--name", name);
        const r = await browser.run(argv);
        if (r.ok) entries.push({ stepIndex: step, argv });
        return resultText(r);
      },
    }),
    betaZodTool({
      name: "wait",
      description:
        "Wait for the page: a CSS selector to be visible, text to appear, URL pattern, or a load state.",
      inputSchema: z.object({
        step: z.number().describe("1-based index of the test step this serves"),
        selector: z.string().optional(),
        text: z.string().optional(),
        urlPattern: z.string().optional().describe("Glob, e.g. **/inventory*"),
        loadState: z.enum(["load", "domcontentloaded", "networkidle"]).optional(),
      }),
      run: async ({ step, selector, text, urlPattern, loadState }) => {
        const argv = ["wait"];
        if (selector) argv.push(selector);
        else if (text) argv.push("--text", text);
        else if (urlPattern) argv.push("--url", urlPattern);
        else if (loadState) argv.push("--load", loadState);
        else return "ERROR: provide one of selector/text/urlPattern/loadState";
        const r = await browser.run(argv, 45_000);
        if (r.ok) entries.push({ stepIndex: step, argv });
        return resultText(r);
      },
    }),
    betaZodTool({
      name: "assert",
      description:
        "Verify an expectation. Fails after a timeout if not satisfied. Use for 'Expect ...' steps.",
      inputSchema: z.object({
        step: z.number().describe("1-based index of the test step this serves"),
        kind: z.enum(["url_contains", "text_visible", "element_visible", "element_text_equals"]),
        value: z
          .string()
          .describe(
            "Substring for url_contains, visible text for text_visible, CSS selector for element_visible, expected text for element_text_equals",
          ),
        selector: z
          .string()
          .optional()
          .describe("CSS selector, required for element_text_equals"),
      }),
      run: async ({ step, kind, value, selector }) => {
        if (kind === "url_contains") {
          const argv = [
            "wait",
            "--fn",
            `location.href.includes(${JSON.stringify(value)})`,
          ];
          const r = await browser.run(argv, 30_000);
          if (r.ok) entries.push({ stepIndex: step, argv });
          return r.ok ? `PASS: URL contains "${value}"` : `FAIL: ${r.output}`;
        }
        if (kind === "text_visible") {
          const argv = ["wait", "--text", value];
          const r = await browser.run(argv, 30_000);
          if (r.ok) entries.push({ stepIndex: step, argv });
          return r.ok ? `PASS: text "${value}" visible` : `FAIL: ${r.output}`;
        }
        if (kind === "element_visible") {
          const argv = ["wait", value];
          const r = await browser.run(argv, 30_000);
          if (r.ok) entries.push({ stepIndex: step, argv });
          return r.ok ? `PASS: ${value} visible` : `FAIL: ${r.output}`;
        }
        // element_text_equals
        if (!selector) return "ERROR: selector required for element_text_equals";
        const waitArgv = ["wait", selector];
        const w = await browser.run(waitArgv, 30_000);
        if (!w.ok) return `FAIL: element ${selector} not visible: ${w.output}`;
        const argv = ["get", "text", selector];
        const r = await browser.run(argv);
        const expect = { field: "text", kind: "equals" as const, value };
        const { ok, actual } = checkExpect(r.data && (r.data as { data?: unknown }).data, expect);
        if (ok) {
          entries.push({ stepIndex: step, argv: waitArgv });
          entries.push({ stepIndex: step, argv, expect });
          return `PASS: text equals "${value}"`;
        }
        return `FAIL: expected "${value}", got "${actual}"`;
      },
    }),
    betaZodTool({
      name: "report_step",
      description: "Report the status of a test step. Call with 'running' before starting it and 'passed'/'failed' when done.",
      inputSchema: z.object({
        step: z.number().describe("1-based index of the test step"),
        status: z.enum(["running", "passed", "failed"]),
        note: z.string().optional().describe("One-line summary of what happened"),
      }),
      run: async ({ step, status, note }) => {
        let screenshotPath: string | undefined;
        if (status !== "running") screenshotPath = await takeScreenshot(step);
        callbacks.onStep(step, status, note, screenshotPath);
        return "ok";
      },
    }),
    betaZodTool({
      name: "finish",
      description: "End the test run. Call exactly once, after the last step (or on the first failure).",
      inputSchema: z.object({
        status: z.enum(["passed", "failed"]),
        reason: z.string().optional().describe("Required when failed: what went wrong"),
      }),
      run: async ({ status, reason }) => {
        finished = { status, reason };
        return "acknowledged - stop now";
      },
    }),
  ];

  // Resolve ${VAR} placeholders (e.g. credentials) from the environment before
  // the agent sees them. The stored step text keeps the placeholder for display.
  const stepsList = test.steps
    .map((s, i) => `${i + 1}. ${resolveVars(s)}`)
    .join("\n");
  let userMessage = `Test: ${test.name}
Start URL (already opened): ${startUrl}

Steps:
${stepsList}`;

  if (heal) {
    userMessage += `

NOTE: A previously recorded replay of this test just FAILED at step ${heal.failedStepIndex} with this error:
${heal.error}

The app may have changed. Execute the full test again from step 1, choosing selectors that match the current page. If the test's expectations genuinely cannot be satisfied, fail the run.`;
  }

  const runner = client.beta.messages.toolRunner({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools,
    messages: [{ role: "user", content: userMessage }],
    max_iterations: 60,
  });

  let tokensUsed = 0;
  for await (const message of runner) {
    tokensUsed += message.usage.input_tokens + message.usage.output_tokens;
    for (const block of message.content) {
      if (block.type === "text" && block.text.trim()) {
        callbacks.onNote(block.text.trim());
      }
    }
  }

  if (!finished) {
    return {
      status: "failed",
      reason: "Agent ended without calling finish (iteration limit or refusal)",
      entries,
      tokensUsed,
    };
  }
  const f = finished as { status: "passed" | "failed"; reason?: string };
  return { status: f.status, reason: f.reason, entries, tokensUsed };
}
