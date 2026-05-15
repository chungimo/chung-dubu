import { readFile } from "node:fs/promises";
import { resolve, dirname, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { configPath, statePath, logsPath } from "./paths.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(HERE, "..");
const INTEGRATION_NAME = "discord-bot";

function fail(msg) {
  throw new Error(`config: ${msg}`);
}

function requireString(obj, path) {
  const value = path.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
  if (typeof value !== "string" || value.length === 0) {
    fail(`missing required string "${path}"`);
  }
  return value;
}

function absolutize(p) {
  if (!p) return p;
  return isAbsolute(p) ? p : resolve(PROJECT_ROOT, p);
}

function resolveConfigPath(arg) {
  if (arg) return absolutize(arg);
  if (process.env.DISCORD_BOT_CONFIG) return absolutize(process.env.DISCORD_BOT_CONFIG);
  return configPath(INTEGRATION_NAME);
}

export async function loadConfig(configPathArg) {
  const path = resolveConfigPath(configPathArg);
  let raw;
  try {
    raw = await readFile(path, "utf8");
  } catch (err) {
    fail(`unable to read ${path}: ${err.message} (run \`npm run setup\` to create a default config)`);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    fail(`${path} is not valid JSON: ${err.message}`);
  }

  requireString(parsed, "discord.token");
  requireString(parsed, "discord.applicationId");

  const allowedGuilds = parsed.discord.allowedGuilds ?? {};
  if (typeof allowedGuilds !== "object" || Array.isArray(allowedGuilds)) {
    fail(`"discord.allowedGuilds" must be an object`);
  }

  for (const [guildId, entry] of Object.entries(allowedGuilds)) {
    if (!entry || typeof entry !== "object") fail(`allowedGuilds[${guildId}] must be an object`);
    if (entry.channels && !Array.isArray(entry.channels)) {
      fail(`allowedGuilds[${guildId}].channels must be an array`);
    }
  }

  return {
    path,
    projectRoot: PROJECT_ROOT,
    discord: {
      token: parsed.discord.token,
      applicationId: parsed.discord.applicationId,
      allowedGuilds,
      requireMention: Boolean(parsed.discord.requireMention),
      ack: parsed.discord.ack === "off" ? "off" : "on",
      debounce: {
        windowMs: Number.isFinite(parsed.discord.debounce?.windowMs)
          ? parsed.discord.debounce.windowMs
          : 1500,
        maxChars: Number.isFinite(parsed.discord.debounce?.maxChars)
          ? parsed.discord.debounce.maxChars
          : 400,
      },
      intents: {
        presence: Boolean(parsed.discord.intents?.presence),
      },
    },
    claude: {
      binary: parsed.claude?.binary ?? "claude",
      permissionMode: parsed.claude?.permissionMode ?? "bypassPermissions",
      model: parsed.claude?.model ?? null,
      cwd: parsed.claude?.cwd ? absolutize(parsed.claude.cwd) : PROJECT_ROOT,
      extraArgs: Array.isArray(parsed.claude?.extraArgs) ? parsed.claude.extraArgs : [],
      timeoutMs: Number.isFinite(parsed.claude?.timeoutMs) ? parsed.claude.timeoutMs : 600_000,
    },
    sessions: {
      file: parsed.sessions?.file
        ? absolutize(parsed.sessions.file)
        : statePath(INTEGRATION_NAME, "sessions.json"),
      idleHours: Number.isFinite(parsed.sessions?.idleHours) ? parsed.sessions.idleHours : 24,
    },
    usage: {
      file: parsed.usage?.file
        ? absolutize(parsed.usage.file)
        : logsPath(INTEGRATION_NAME, "usage.jsonl"),
      monthlyBudgetUsd: Number.isFinite(parsed.usage?.monthlyBudgetUsd)
        ? parsed.usage.monthlyBudgetUsd
        : 100,
    },
    log: {
      level: parsed.log?.level ?? "info",
    },
  };
}

export function isChannelAllowed(config, guildId, channelId) {
  const guild = config.discord.allowedGuilds[guildId];
  if (!guild) return false;
  if (!guild.channels || guild.channels.length === 0) return true;
  return guild.channels.includes(channelId);
}
