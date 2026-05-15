import { loadConfig } from "./config.mjs";
import { SessionStore } from "./sessions.mjs";
import { createMessageHandler } from "./handler.mjs";
import { startBot } from "./bot.mjs";
import { PresenceCache } from "./presence.mjs";
import { UsageLogger } from "./usage.mjs";

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

function createLogger(level) {
  const threshold = LEVELS[level] ?? LEVELS.info;
  const emit = (lvl, msg) => {
    if (LEVELS[lvl] >= threshold) {
      const stamp = new Date().toISOString();
      const stream = lvl === "error" || lvl === "warn" ? process.stderr : process.stdout;
      stream.write(`${stamp} [${lvl}] ${msg}\n`);
    }
  };
  return {
    debug: (m) => emit("debug", m),
    info: (m) => emit("info", m),
    warn: (m) => emit("warn", m),
    error: (m) => emit("error", m),
  };
}

async function main() {
  const config = await loadConfig(process.argv[2]);
  const log = createLogger(config.log.level);
  log.info(`loaded config from ${config.path}`);

  const sessions = new SessionStore(config.sessions);
  await sessions.load();
  log.info(`session store: ${sessions.entries.size} entries (idle=${config.sessions.idleHours}h)`);

  const presenceCache = config.discord.intents.presence ? new PresenceCache() : null;
  if (presenceCache) log.info("presence cache enabled (requires GuildPresences privileged intent)");

  const usageLogger = new UsageLogger(config.usage);
  await usageLogger.load();
  log.info(`usage log: ${usageLogger.monthKey} mtd=$${usageLogger.monthTotalUsd.toFixed(2)} (${usageLogger.monthCount} msg), budget=$${config.usage.monthlyBudgetUsd}`);

  const botCtx = { userId: null };
  const handler = createMessageHandler({
    config,
    sessions,
    usageLogger,
    log,
    getBotUserId: () => botCtx.userId,
  });
  const messageHandler = (data) => handler(data);

  const client = await startBot({
    config,
    messageHandler,
    presenceCache,
    onReady: async (data) => {
      botCtx.userId = data?.user?.id ?? null;
      const tag = data?.user?.username ?? "unknown";
      log.info(`gateway ready as ${tag} (${botCtx.userId})`);
    },
  });

  const shutdown = (sig) => {
    log.warn(`received ${sig}, shutting down`);
    try { client.getPlugin("gateway")?.stop?.(); } catch {}
    process.exit(0);
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  log.info("starting bot...");
}

main().catch((err) => {
  console.error(`fatal: ${err.stack ?? err.message}`);
  process.exit(1);
});
