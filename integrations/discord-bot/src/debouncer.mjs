export class MessageDebouncer {
  constructor({ windowMs, maxChars, onFlush, onError }) {
    this.windowMs = Math.max(0, windowMs);
    this.maxChars = Math.max(0, maxChars);
    this.onFlush = onFlush;
    this.onError = onError ?? ((err) => console.error(`debouncer flush: ${err.message}`));
    this.pending = new Map();
    this.queues = new Map();
  }

  shouldDebounce(entry) {
    if (this.windowMs <= 0) return false;
    const raw = entry.message?.rawData ?? {};
    if ((raw.attachments ?? []).length > 0) return false;
    if ((raw.sticker_items ?? []).length > 0) return false;
    if (this.maxChars > 0 && (entry.message?.content ?? "").length > this.maxChars) return false;
    return true;
  }

  enqueue(key, entry) {
    if (!this.shouldDebounce(entry)) {
      this.flushImmediate(key, [entry]);
      return;
    }
    const slot = this.pending.get(key) ?? { entries: [], timer: null };
    if (slot.timer) clearTimeout(slot.timer);
    slot.entries.push(entry);
    slot.timer = setTimeout(() => this.flushTimer(key), this.windowMs);
    this.pending.set(key, slot);
  }

  flushTimer(key) {
    const slot = this.pending.get(key);
    if (!slot) return;
    this.pending.delete(key);
    this.flushImmediate(key, slot.entries);
  }

  flushImmediate(key, entries) {
    if (entries.length === 0) return;
    const prev = this.queues.get(key) ?? Promise.resolve();
    const next = prev.then(() => this.onFlush(entries)).catch(this.onError);
    this.queues.set(key, next.finally(() => {
      if (this.queues.get(key) === next) this.queues.delete(key);
    }));
  }
}

export function combinePrompts(entries) {
  return entries
    .map((e) => (e.message?.content ?? "").trim())
    .filter(Boolean)
    .join("\n\n");
}
