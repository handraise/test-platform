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
  cached = JSON.parse(fs.readFileSync(file, "utf8")) as IbudConfig;
  return cached;
}
