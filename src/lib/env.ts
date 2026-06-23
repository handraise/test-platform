import fs from "node:fs";
import path from "node:path";

let loaded = false;

const ENV_ALIASES: Record<string, string> = {
  HANDRAISE_EMAIL: "E2E_USER_EMAIL",
  HANDRAISE_PASSWORD: "E2E_USER_PASSWORD",
  E2E_USER_EMAIL: "HANDRAISE_EMAIL",
  E2E_USER_PASSWORD: "HANDRAISE_PASSWORD",
};

/**
 * Load .env.local into process.env (once). Next.js already does this for the
 * web app; this covers the CLI path and any standalone script. Existing env
 * vars win, so shell exports are never overwritten.
 */
export function loadEnvLocal(): void {
  if (loaded) return;
  loaded = true;
  const file = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (m && process.env[m[1]] === undefined && m[2] !== "") {
      process.env[m[1]] = m[2];
    }
  }
}

/** Replace ${VAR} placeholders with values from the environment. */
export function resolveVars(input: string): string {
  loadEnvLocal();
  return input.replace(/\$\{([A-Z_][A-Z0-9_]*)\}/g, (whole, key) => {
    const v = process.env[key] || process.env[ENV_ALIASES[key]];
    return v === undefined ? whole : v;
  });
}
