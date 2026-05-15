import { isChannelAllowed } from "./config.mjs";
import { threadKey } from "./sessions.mjs";
import { runClaude, ClaudeError } from "./claude.mjs";
import { chunkForDiscord } from "./chunk.mjs";
import { MessageDebouncer, combinePrompts } from "./debouncer.mjs";
import { addReaction, removeOwnReaction, ACK_THINKING, ACK_ERROR } from "./reactions.mjs";

export function createMessageHandler({ config, sessions, usageLogger, log, getBotUserId }) {
  const ackEnabled = config.discord.ack !== "off";

  const debouncer = new MessageDebouncer({
    windowMs: config.discord.debounce.windowMs,
    maxChars: config.discord.debounce.maxChars,
    onFlush: (entries) => flushBatch(entries),
    onError: (err) => log.error(`debouncer: ${err.stack ?? err.message}`),
  });

  async function flushBatch(entries) {
    const last = entries[entries.length - 1];
    const message = last.message;
    const guildId = last.guildId;
    const channelId = message.channelId;
    const sessionKey = threadKey({ guildId, channelId });
    const client = message.client;

    const prompt = combinePrompts(entries);
    if (!prompt) return;

    let ackTarget = ackEnabled
      ? { client, channelId, messageId: message.id }
      : null;
    if (ackTarget) await addReaction({ ...ackTarget, emoji: ACK_THINKING });

    await sendTyping(client, channelId);

    try {
      const resumeId = sessions.get(sessionKey);
      log.info(`claude: ${resumeId ? "resume" : "new"} ${sessionKey} (${entries.length} msg, ${prompt.length} chars)`);
      const { sessionId, text, raw } = await runClaude({
        prompt,
        resumeSessionId: resumeId,
        claudeConfig: config.claude,
      });
      sessions.set(sessionKey, sessionId);

      try {
        const u = await usageLogger.record({
          sessionKey,
          sessionId,
          resumed: Boolean(resumeId),
          messageCount: entries.length,
          raw,
        });
        log.info(u.summary);
      } catch (err) {
        log.warn(`usage log failed: ${err.message}`);
      }

      const chunks = chunkForDiscord(text);
      if (chunks.length === 0) {
        await safeReply(message, "_(empty response)_");
      } else {
        for (let i = 0; i < chunks.length; i++) {
          if (i === 0) await safeReply(message, chunks[i]);
          else await safeSend(client, channelId, chunks[i]);
        }
      }
      if (ackTarget) await removeOwnReaction({ ...ackTarget, emoji: ACK_THINKING });
    } catch (err) {
      if (ackTarget) {
        await removeOwnReaction({ ...ackTarget, emoji: ACK_THINKING });
        await addReaction({ ...ackTarget, emoji: ACK_ERROR });
      }
      if (err instanceof ClaudeError) {
        log.error(`claude error: ${err.message}${err.stderr ? `\n${err.stderr.slice(0, 400)}` : ""}`);
        await safeReply(message, `_claude error: ${err.message}_`);
      } else {
        log.error(`handler error: ${err.stack ?? err.message}`);
        await safeReply(message, `_handler error: ${err.message}_`);
      }
    }
  }

  return function handle(data) {
    const message = data.message;
    if (!message) return;
    const raw = message.rawData ?? {};
    const botUserId = getBotUserId();
    const authorId = raw.author?.id;
    if (!authorId || authorId === botUserId) return;
    if (raw.author?.bot) return;

    const guildId = raw.guild_id ?? null;
    const channelId = message.channelId;
    if (!channelId) return;
    if (guildId && !isChannelAllowed(config, guildId, channelId)) return;

    const content = (message.content ?? "").trim();
    if (!content) return;

    const mentioned = (raw.mentions ?? []).some((u) => u.id === botUserId);
    if (config.discord.requireMention && guildId && !mentioned) return;

    const promptText = stripMention(content, botUserId);
    if (!promptText) return;

    const entryMessage = Object.create(message);
    Object.defineProperty(entryMessage, "content", { value: promptText, enumerable: true });

    const key = `${guildId ?? "dm"}:${channelId}:${authorId}`;
    debouncer.enqueue(key, { message: entryMessage, guildId });
  };
}

function stripMention(content, botUserId) {
  if (!botUserId) return content;
  return content.replace(new RegExp(`<@!?${botUserId}>`, "g"), "").trim();
}

async function safeReply(message, content) {
  try {
    await message.reply({ content, allowed_mentions: { parse: [] } });
  } catch (err) {
    console.error(`reply failed: ${err.message}`);
  }
}

async function safeSend(client, channelId, content) {
  try {
    const channel = await client.fetchChannel(channelId);
    if (channel && "send" in channel) {
      await channel.send({ content, allowed_mentions: { parse: [] } });
    }
  } catch (err) {
    console.error(`send failed: ${err.message}`);
  }
}

async function sendTyping(client, channelId) {
  try {
    await client.rest.post(`/channels/${channelId}/typing`);
  } catch {}
}
