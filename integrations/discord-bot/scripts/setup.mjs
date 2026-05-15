#!/usr/bin/env node
import { copyFile, access, readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  dubuRoot,
  configPath,
  statePath,
  logsPath,
  ensureDubuDirsSync,
} from "../src/paths.mjs";

const INTEGRATION = "discord-bot";
const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(HERE, "..");

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function main() {
  const root = dubuRoot();
  const cfg = configPath(INTEGRATION);
  const state = statePath(INTEGRATION);
  const logs = logsPath(INTEGRATION);

  console.log(`dubu root:    ${root}`);
  console.log(`config path:  ${cfg}`);
  console.log(`state dir:    ${state}`);
  console.log(`logs dir:     ${logs}`);
  console.log();

  ensureDubuDirsSync(INTEGRATION);
  console.log("✓ created config/state/logs directories");

  const example = resolve(PROJECT_ROOT, "config.example.json");
  if (await exists(cfg)) {
    console.log(`✓ config already exists at ${cfg} (leaving as-is)`);
  } else {
    await copyFile(example, cfg);
    console.log(`✓ seeded ${cfg} from config.example.json`);
  }

  const cfgText = await readFile(cfg, "utf8");
  const stillPlaceholders = /PASTE_BOT_TOKEN_HERE|PASTE_APP_ID_HERE|GUILD_ID_HERE|CHANNEL_ID_HERE/.test(cfgText);

  console.log();
  if (stillPlaceholders) {
    console.log("Next steps:");
    console.log(`  1. Edit ${cfg}`);
    console.log("     - Set discord.token (Discord Developer Portal > Bot > Reset Token)");
    console.log("     - Set discord.applicationId (Developer Portal > General Information)");
    console.log("     - Replace GUILD_ID_HERE / CHANNEL_ID_HERE with real IDs");
    console.log("  2. Enable Message Content Intent (Developer Portal > Bot > Privileged Intents)");
    console.log("  3. Invite the bot to your server with: Send Messages, Read History, Add Reactions");
    console.log("  4. Start it: npm start");
  } else {
    console.log("Config looks filled in. Start the bot with: npm start");
  }
}

main().catch((err) => {
  console.error(`setup failed: ${err.stack ?? err.message}`);
  process.exit(1);
});
