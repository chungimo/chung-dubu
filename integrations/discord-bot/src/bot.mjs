import { Client, MessageCreateListener, PresenceUpdateListener, ReadyListener } from "@buape/carbon";
import { GatewayPlugin, GatewayIntents } from "@buape/carbon/gateway";

function resolveIntents({ presence }) {
  let intents =
    GatewayIntents.Guilds |
    GatewayIntents.GuildMessages |
    GatewayIntents.MessageContent |
    GatewayIntents.DirectMessages;
  if (presence) intents |= GatewayIntents.GuildPresences;
  return intents;
}

class HandlerMessageListener extends MessageCreateListener {
  constructor(handler) {
    super();
    this.handler = handler;
  }
  async handle(data) {
    Promise.resolve().then(() => this.handler(data)).catch((err) => {
      console.error(`message listener: ${err.stack ?? err.message}`);
    });
  }
}

class StatusReadyListener extends ReadyListener {
  constructor(onReady) {
    super();
    this.onReady = onReady;
  }
  async handle(data, client) {
    await this.onReady(data, client);
  }
}

class PresenceCacheListener extends PresenceUpdateListener {
  constructor(cache) {
    super();
    this.cache = cache;
  }
  async handle(data) {
    const userId = data?.user?.id;
    if (!userId) return;
    this.cache.upsert(userId, data);
  }
}

export async function startBot({ config, messageHandler, presenceCache, onReady }) {
  const gatewayPlugin = new GatewayPlugin({
    intents: resolveIntents({ presence: config.discord.intents.presence }),
  });
  const listeners = [
    new StatusReadyListener(onReady),
    new HandlerMessageListener(messageHandler),
  ];
  if (config.discord.intents.presence && presenceCache) {
    listeners.push(new PresenceCacheListener(presenceCache));
  }
  const client = new Client(
    {
      baseUrl: "http://localhost",
      deploySecret: "unused",
      clientId: config.discord.applicationId,
      publicKey: "unused",
      token: config.discord.token,
      autoDeploy: false,
    },
    { commands: [], listeners, components: [], modals: [] },
    [gatewayPlugin],
  );
  return client;
}
