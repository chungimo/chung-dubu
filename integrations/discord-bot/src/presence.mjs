const DEFAULT_MAX = 5000;

export class PresenceCache {
  constructor({ maxEntries = DEFAULT_MAX } = {}) {
    this.maxEntries = Math.max(1, maxEntries);
    this.entries = new Map();
  }

  upsert(userId, payload) {
    if (!userId) return;
    if (this.entries.has(userId)) this.entries.delete(userId);
    this.entries.set(userId, {
      userId,
      status: payload.status ?? "offline",
      clientStatus: payload.client_status ?? null,
      activities: payload.activities ?? [],
      guildId: payload.guild_id ?? null,
      updatedAt: Date.now(),
    });
    while (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next().value;
      this.entries.delete(oldest);
    }
  }

  get(userId) {
    return this.entries.get(userId) ?? null;
  }

  size() {
    return this.entries.size;
  }
}
