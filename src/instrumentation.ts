// Runs once per server start (Next.js instrumentation hook).
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { reconcileOrphanedRuns } = await import("./lib/runner");
  reconcileOrphanedRuns();
}
