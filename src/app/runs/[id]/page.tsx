import { RunView } from "@/components/RunView";
import { loadConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function RunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RunView runId={id} viewportUrl={loadConfig().agentBrowserDashboardUrl} />;
}
