"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RunButton({
  testId,
  size = "md",
}: {
  testId: string;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const start = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { runId } = (await res.json()) as { runId: string };
      router.push(`/runs/${runId}`);
    } catch (err) {
      alert(`Failed to start run: ${String(err)}`);
      setBusy(false);
    }
  };

  return (
    <button
      onClick={start}
      disabled={busy}
      className={`rounded-md bg-ink text-bg font-medium hover:bg-dim transition-colors disabled:opacity-50 disabled:cursor-wait ${
        size === "sm" ? "px-3 py-1 text-[12px]" : "px-4 py-1.5 text-[13px]"
      }`}
    >
      {busy ? "Starting…" : "Run"}
    </button>
  );
}
