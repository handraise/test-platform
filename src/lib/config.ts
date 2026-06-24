import fs from "node:fs";
import path from "node:path";

export interface IbudConfig {
  baseUrl: string;
  testDir: string;
  dataDir: string;
  headless: boolean;
  agentBrowserDashboardUrl: string;
}

let cached: IbudConfig | null = null;

export function loadConfig(): IbudConfig {
  if (cached) return cached;
  const file = path.join(process.cwd(), "ibud.config.json");
  const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as IbudConfig;
  // Env overrides the baked-in value so each environment sets its own URL
  // (empty string hides the viewport link).
  cached = {
    ...parsed,
    agentBrowserDashboardUrl:
      process.env.AGENT_BROWSER_DASHBOARD_URL ?? parsed.agentBrowserDashboardUrl,
  };
  return cached;
}
