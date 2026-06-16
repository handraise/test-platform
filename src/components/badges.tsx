export function StatusLed({ status }: { status: string }) {
  const color =
    status === "passed"
      ? "bg-green"
      : status === "failed" || status === "error"
        ? "bg-red"
        : status === "running"
          ? "bg-amber led-running"
          : "bg-line-2";
  return <span className={`led ${color}`} />;
}

export function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "passed"
      ? "text-green bg-green/10"
      : status === "failed" || status === "error"
        ? "text-red bg-red/10"
        : status === "running"
          ? "text-amber bg-amber/10"
          : "text-dim bg-panel-2";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-medium capitalize ${cls}`}
    >
      <StatusLed status={status} />
      {status}
    </span>
  );
}

const MODE_STYLES: Record<string, { cls: string; label: string; title: string }> = {
  ai: {
    cls: "text-blue bg-blue/10",
    label: "AI",
    title: "Executed live by the AI agent",
  },
  replay: {
    cls: "text-dim bg-panel-2",
    label: "Replay",
    title: "Replayed from cached script — no AI",
  },
  healed: {
    cls: "text-amber bg-amber/10",
    label: "Healed",
    title: "Replay failed; AI healed and re-recorded",
  },
  playwright: {
    cls: "text-blue bg-blue/10",
    label: "Playwright",
    title: "Ran via the Playwright test runner",
  },
};

export function KindBadge({ kind }: { kind: string }) {
  if (kind === "playwright") {
    return (
      <span className="inline-block rounded-full px-2 py-0.5 text-[11px] font-medium text-blue bg-blue/10">
        Playwright
      </span>
    );
  }
  return (
    <span className="inline-block rounded-full px-2 py-0.5 text-[11px] font-medium text-dim bg-panel-2">
      AI
    </span>
  );
}

export function ModeBadge({ mode }: { mode: string }) {
  const m = MODE_STYLES[mode] ?? {
    cls: "text-dim bg-panel-2",
    label: mode,
    title: mode,
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-[12px] font-medium ${m.cls}`}
      title={m.title}
    >
      {m.label}
    </span>
  );
}

export function formatDuration(start?: string | Date | null, end?: string | Date | null) {
  if (!start || !end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`;
}

export function formatTime(value?: string | Date | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
