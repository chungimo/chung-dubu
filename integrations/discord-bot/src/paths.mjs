import { homedir } from "node:os";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync, existsSync, mkdirSync } from "node:fs";

/**
 * Dubu integration filesystem convention.
 *
 * Configs: {DUBU_HOME}/config/<integration>.json
 * State:   {DUBU_HOME}/state/<integration>/...
 * Logs:    {DUBU_HOME}/logs/<integration>/...
 *
 * DUBU_HOME is resolved in this order:
 *   1. process.env.DUBU_HOME
 *   2. The `DUBU_HOME = "..."` line in chung-dubu/CLAUDE.local.md
 *   3. ~/dubu (the dubu framework default for macOS/Linux)
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const DUBU_REPO_ROOT = resolve(HERE, "..", "..", "..");

let cachedRoot = null;

export function dubuRoot() {
  if (cachedRoot) return cachedRoot;
  if (process.env.DUBU_HOME) {
    cachedRoot = resolve(process.env.DUBU_HOME);
    return cachedRoot;
  }
  const fromLocalConfig = readDubuHomeFromLocalConfig();
  if (fromLocalConfig) {
    cachedRoot = resolve(fromLocalConfig);
    return cachedRoot;
  }
  cachedRoot = resolve(homedir(), "dubu");
  return cachedRoot;
}

function readDubuHomeFromLocalConfig() {
  const localMd = resolve(DUBU_REPO_ROOT, "CLAUDE.local.md");
  if (!existsSync(localMd)) return null;
  try {
    const text = readFileSync(localMd, "utf8");
    const match = text.match(/^\s*DUBU_HOME\s*=\s*"?([^"\n]+?)"?\s*$/m);
    if (!match) return null;
    let value = match[1].trim();
    if (value.startsWith("~")) value = resolve(homedir(), value.slice(2));
    return value;
  } catch {
    return null;
  }
}

export function configPath(integration) {
  return resolve(dubuRoot(), "config", `${integration}.json`);
}

export function statePath(integration, ...parts) {
  return resolve(dubuRoot(), "state", integration, ...parts);
}

export function logsPath(integration, ...parts) {
  return resolve(dubuRoot(), "logs", integration, ...parts);
}

export function ensureDubuDirsSync(integration) {
  mkdirSync(resolve(dubuRoot(), "config"), { recursive: true });
  if (integration) {
    mkdirSync(statePath(integration), { recursive: true });
    mkdirSync(logsPath(integration), { recursive: true });
  }
}
