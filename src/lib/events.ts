import { EventEmitter } from "node:events";

export type RunEvent =
  | { type: "run_started"; runId: string; testId: string; mode: string }
  | {
      type: "step_update";
      runId: string;
      stepIndex: number;
      status: "running" | "passed" | "failed";
      note?: string;
      screenshotPath?: string;
      tracePath?: string;
      videoPath?: string;
    }
  | { type: "agent_note"; runId: string; text: string }
  | {
      type: "run_finished";
      runId: string;
      status: "passed" | "failed" | "error";
      mode: string;
      error?: string;
    };

interface RunChannel {
  emitter: EventEmitter;
  history: RunEvent[];
  done: boolean;
}

// Survive Next.js dev-mode module reloads by stashing on globalThis.
const globalStore = globalThis as unknown as {
  __ibudRunChannels?: Map<string, RunChannel>;
};
const channels = (globalStore.__ibudRunChannels ??= new Map<string, RunChannel>());

function channel(runId: string): RunChannel {
  let ch = channels.get(runId);
  if (!ch) {
    ch = { emitter: new EventEmitter(), history: [], done: false };
    ch.emitter.setMaxListeners(50);
    channels.set(runId, ch);
  }
  return ch;
}

export function emitRunEvent(event: RunEvent): void {
  const ch = channel(event.runId);
  ch.history.push(event);
  if (event.type === "run_finished") ch.done = true;
  ch.emitter.emit("event", event);
}

/** History so far plus whether the run already finished. */
export function getRunHistory(runId: string): { events: RunEvent[]; done: boolean } {
  const ch = channels.get(runId);
  return { events: ch?.history ?? [], done: ch?.done ?? true };
}

export function subscribeRun(
  runId: string,
  listener: (event: RunEvent) => void,
): () => void {
  const ch = channel(runId);
  ch.emitter.on("event", listener);
  return () => ch.emitter.off("event", listener);
}
