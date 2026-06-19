"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ModeBadge,
  StatusBadge,
  StatusLed,
  formatDuration,
  formatTime,
} from "@/components/badges";

interface StepState {
  index: number;
  instruction: string;
  status: string;
  note?: string | null;
  screenshotPath?: string | null;
  tracePath?: string | null;
  videoPath?: string | null;
}

const artifactUrl = (p: string) =>
  `/api/artifacts/${p.replace(/^data\/artifacts\//, "")}`;

interface RunData {
  run: {
    id: string;
    testId: string;
    mode: string;
    status: string;
    startedAt: string;
    finishedAt?: string | null;
    error?: string | null;
    tokensUsed?: number | null;
  };
  steps: StepState[];
  test: { id: string; name: string; path: string } | null;
}

type SseEvent =
  | { type: "run_started"; mode: string }
  | {
      type: "step_update";
      stepIndex: number;
      status: string;
      note?: string;
      screenshotPath?: string;
      tracePath?: string;
      videoPath?: string;
    }
  | { type: "agent_note"; text: string }
  | { type: "run_finished"; status: string; mode: string; error?: string };

export function RunView({
  runId,
  viewportUrl,
}: {
  runId: string;
  viewportUrl: string;
}) {
  const [data, setData] = useState<RunData | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [selectedShot, setSelectedShot] = useState<string | null>(null);
  const [showViewport, setShowViewport] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/runs/${runId}`);
    if (!res.ok) return null;
    const json = (await res.json()) as RunData;
    setData(json);
    return json;
  }, [runId]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const initial = await load();
      if (cancelled || !initial) return;
      if (initial.run.status !== "running") return;

      const es = new EventSource(`/api/runs/${runId}/stream`);
      esRef.current = es;

      es.onmessage = (msg) => {
        const event = JSON.parse(msg.data) as SseEvent;
        if (event.type === "step_update") {
          setData((prev) =>
            prev
              ? {
                  ...prev,
                  steps: prev.steps.map((s) =>
                    s.index === event.stepIndex
                      ? {
                          ...s,
                          status: event.status,
                          note: event.note ?? s.note,
                          screenshotPath: event.screenshotPath ?? s.screenshotPath,
                          tracePath: event.tracePath ?? s.tracePath,
                          videoPath: event.videoPath ?? s.videoPath,
                        }
                      : s,
                  ),
                }
              : prev,
          );
          if (event.screenshotPath) setSelectedShot(event.screenshotPath);
        } else if (event.type === "agent_note") {
          setNotes((n) => [...n, event.text]);
        } else if (event.type === "run_started") {
          setData((prev) =>
            prev ? { ...prev, run: { ...prev.run, mode: event.mode } } : prev,
          );
        } else if (event.type === "run_finished") {
          es.close();
          void load();
        }
      };
      es.onerror = () => {
        es.close();
        void load();
      };
    })();

    return () => {
      cancelled = true;
      esRef.current?.close();
    };
  }, [runId, load]);

  if (!data) {
    return <p className="text-dim text-[13px] animate-pulse">Loading run…</p>;
  }

  const { run, steps, test } = data;
  const running = run.status === "running";
  const shots = steps.filter((s) => s.screenshotPath);
  const shown = selectedShot ?? shots[shots.length - 1]?.screenshotPath ?? null;
  const artifactSteps = steps.filter((s) => s.tracePath || s.videoPath);
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="space-y-8">
      <section className="rise">
        <p className="text-[13px] text-dim mb-3">
          <Link href="/" className="hover:text-ink transition-colors">
            Tests
          </Link>{" "}
          <span className="text-faint">/</span>{" "}
          {test && (
            <>
              <Link href={`/tests/${test.id}`} className="hover:text-ink transition-colors">
                {test.name}
              </Link>{" "}
              <span className="text-faint">/</span>{" "}
            </>
          )}
          <span className="font-[family-name:var(--font-mono)]">{run.id}</span>
        </p>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">
            {test?.name ?? run.id}
          </h1>
          <div className="flex items-center gap-2">
            <StatusBadge status={run.status} />
            <ModeBadge mode={run.mode} />
          </div>
        </div>
        <p className="text-dim text-[13px] mt-2">
          {formatTime(run.startedAt)} · {formatDuration(run.startedAt, run.finishedAt)}
          {run.tokensUsed ? ` · ${run.tokensUsed.toLocaleString()} tokens` : ""}
        </p>
        {running && <div className="progress-bar mt-5" />}
        {run.error && (
          <p className="mt-4 rounded-lg border border-red/30 bg-red/5 text-red text-[13px] px-4 py-3">
            {run.error}
          </p>
        )}
      </section>

      <section className="grid lg:grid-cols-[5fr_4fr] gap-6">
        <div
          className="rounded-xl border border-line bg-panel overflow-hidden rise self-start"
          style={{ animationDelay: "40ms" }}
        >
          <p className="text-[12px] font-medium text-dim px-5 py-2.5 border-b border-line">
            Steps
          </p>
          <ol>
            {steps.map((step) => (
              <li
                key={step.index}
                className={`flex gap-3.5 px-5 py-3.5 border-b border-line last:border-b-0 transition-colors ${
                  step.screenshotPath ? "cursor-pointer hover:bg-panel-2/60" : ""
                } ${shown && step.screenshotPath === shown ? "bg-panel-2/60" : ""}`}
                onClick={() =>
                  step.screenshotPath && setSelectedShot(step.screenshotPath)
                }
              >
                <div className="pt-1.5">
                  <StatusLed status={step.status} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px]">
                    <span className="text-faint mr-2 font-[family-name:var(--font-mono)]">
                      {step.index}
                    </span>
                    {step.instruction}
                  </p>
                  {step.note && (
                    <p
                      className={`text-[12px] mt-1 ${
                        step.status === "failed" ? "text-red" : "text-dim"
                      }`}
                    >
                      {step.note}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>

          {notes.length > 0 && (
            <div className="border-t border-line">
              <p className="text-[12px] font-medium text-dim px-5 py-2.5 border-b border-line">
                Agent log
              </p>
              <div className="p-5 space-y-2 max-h-48 overflow-y-auto">
                {notes.map((n, i) => (
                  <p key={i} className="text-[12px] text-dim rise">
                    {n}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div
            className="rounded-xl border border-line bg-panel overflow-hidden rise"
            style={{ animationDelay: "80ms" }}
          >
            <div className="flex items-center justify-between px-5 py-2.5 border-b border-line">
              <p className="text-[12px] font-medium text-dim">
                {showViewport && running ? "Live viewport" : "Screenshot"}
              </p>
              {running && viewportUrl && (
                <button
                  onClick={() => setShowViewport((v) => !v)}
                  className="text-[12px] text-dim hover:text-ink transition-colors"
                >
                  {showViewport ? "Show screenshots" : "Watch live ↗"}
                </button>
              )}
            </div>
            {showViewport && running ? (
              <iframe
                src={viewportUrl}
                className="w-full aspect-[4/3] bg-bg"
                title="agent-browser live viewport"
              />
            ) : shown ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/screenshots/${shown.replace(/^data\/screenshots\//, "")}`}
                alt="step screenshot"
                className="w-full"
              />
            ) : (
              <p className="p-8 text-dim text-[12px]">
                {running ? "Waiting for first screenshot…" : "No screenshots captured"}
              </p>
            )}
          </div>

          {shots.length > 1 && (
            <div className="flex gap-1.5 flex-wrap">
              {shots.map((s) => (
                <button
                  key={s.index}
                  onClick={() => setSelectedShot(s.screenshotPath!)}
                  className={`rounded-md border px-2.5 py-1 text-[12px] transition-colors ${
                    shown === s.screenshotPath
                      ? "border-line-2 text-ink bg-panel-2"
                      : "border-line text-dim hover:text-ink"
                  }`}
                >
                  {s.index}
                </button>
              ))}
            </div>
          )}

          {artifactSteps.length > 0 && (
            <div
              className="rounded-xl border border-line bg-panel overflow-hidden rise"
              style={{ animationDelay: "120ms" }}
            >
              <p className="text-[12px] font-medium text-dim px-5 py-2.5 border-b border-line">
                Playwright artifacts
              </p>
              <div className="divide-y divide-line">
                {artifactSteps.map((s) => (
                  <div key={s.index} className="p-4 space-y-3">
                    {artifactSteps.length > 1 && (
                      <p className="text-[12px] text-dim truncate">
                        <span className="text-faint mr-2">{s.index}</span>
                        {s.instruction}
                      </p>
                    )}
                    {s.videoPath && (
                      <video
                        src={artifactUrl(s.videoPath)}
                        controls
                        className="w-full rounded-md border border-line bg-bg"
                      />
                    )}
                    {s.tracePath && (
                      <div className="flex items-center gap-3 text-[12px]">
                        <a
                          href={`https://trace.playwright.dev/?trace=${encodeURIComponent(
                            `${origin}${artifactUrl(s.tracePath)}`,
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue hover:underline"
                        >
                          Open trace ↗
                        </a>
                        <a
                          href={artifactUrl(s.tracePath)}
                          download
                          className="text-dim hover:text-ink transition-colors"
                        >
                          Download .zip
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
