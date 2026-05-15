import { readFile, writeFile, rename, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

export class SessionStore {
  constructor({ file, idleHours }) {
    this.file = file;
    this.idleMs = Math.max(0, idleHours) * 3_600_000;
    this.entries = new Map();
    this.writeQueue = Promise.resolve();
  }

  async load() {
    let raw;
    try {
      raw = await readFile(this.file, "utf8");
    } catch (err) {
      if (err.code === "ENOENT") return;
      throw err;
    }
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return;
    }
    const entries = parsed?.entries ?? {};
    for (const [key, value] of Object.entries(entries)) {
      if (value?.sessionId) {
        this.entries.set(key, {
          sessionId: value.sessionId,
          provider: value.provider ?? null,
          updatedAt: value.updatedAt ?? Date.now(),
        });
      }
    }
  }

  get(threadKey, provider = null) {
    const entry = this.entries.get(threadKey);
    if (!entry) return null;
    if (provider && entry.provider !== provider) {
      this.entries.delete(threadKey);
      this.scheduleWrite();
      return null;
    }
    if (this.idleMs > 0 && Date.now() - entry.updatedAt > this.idleMs) {
      this.entries.delete(threadKey);
      this.scheduleWrite();
      return null;
    }
    return entry.sessionId;
  }

  set(threadKey, sessionId, provider = null) {
    this.entries.set(threadKey, { sessionId, provider, updatedAt: Date.now() });
    this.scheduleWrite();
  }

  scheduleWrite() {
    this.writeQueue = this.writeQueue.then(() => this.persist()).catch((err) => {
      console.error(`sessions: persist failed: ${err.message}`);
    });
  }

  async persist() {
    const data = {
      version: 1,
      entries: Object.fromEntries(this.entries),
    };
    await mkdir(dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp`;
    await writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
    await rename(tmp, this.file);
  }
}

export function threadKey({ guildId, channelId }) {
  return `${guildId ?? "dm"}:${channelId}`;
}
