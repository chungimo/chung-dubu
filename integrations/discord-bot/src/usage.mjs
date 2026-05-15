import { appendFile, readFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

export function currentMonthKey(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function extractUsage(raw) {
  const u = raw?.usage ?? {};
  const modelName = raw?.modelUsage ? Object.keys(raw.modelUsage)[0] ?? null : null;
  return {
    provider: raw?.provider ?? "claude",
    costUsd: Number(raw?.total_cost_usd ?? 0) || 0,
    inputTokens: Number(u.input_tokens ?? 0) || 0,
    outputTokens: Number(u.output_tokens ?? 0) || 0,
    cacheCreationTokens: Number(u.cache_creation_input_tokens ?? 0) || 0,
    cacheReadTokens: Number(u.cache_read_input_tokens ?? 0) || 0,
    durationMs: Number(raw?.duration_ms ?? 0) || 0,
    numTurns: Number(raw?.num_turns ?? 0) || 0,
    model: modelName,
    isError: Boolean(raw?.is_error),
  };
}

export class UsageLogger {
  constructor({ file, monthlyBudgetUsd }) {
    this.file = file;
    this.monthlyBudgetUsd = monthlyBudgetUsd > 0 ? monthlyBudgetUsd : 0;
    this.monthKey = currentMonthKey();
    this.monthTotalUsd = 0;
    this.monthCount = 0;
  }

  async load() {
    let raw;
    try {
      raw = await readFile(this.file, "utf8");
    } catch (err) {
      if (err.code === "ENOENT") return;
      throw err;
    }
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      let rec;
      try {
        rec = JSON.parse(trimmed);
      } catch {
        continue;
      }
      if (rec.month === this.monthKey) {
        this.monthTotalUsd += Number(rec.costUsd ?? 0) || 0;
        this.monthCount += 1;
      }
    }
  }

  rollMonthIfNeeded() {
    const now = currentMonthKey();
    if (now !== this.monthKey) {
      this.monthKey = now;
      this.monthTotalUsd = 0;
      this.monthCount = 0;
    }
  }

  async record({ sessionKey, sessionId, resumed, messageCount, raw }) {
    this.rollMonthIfNeeded();
    const usage = extractUsage(raw);
    const now = new Date();
    const rec = {
      ts: now.toISOString(),
      month: this.monthKey,
      sessionKey,
      sessionId,
      resumed: Boolean(resumed),
      messageCount: messageCount ?? 1,
      ...usage,
    };
    this.monthTotalUsd += usage.costUsd;
    this.monthCount += 1;

    await mkdir(dirname(this.file), { recursive: true });
    await appendFile(this.file, JSON.stringify(rec) + "\n", "utf8");

    return {
      costUsd: usage.costUsd,
      monthTotalUsd: this.monthTotalUsd,
      monthCount: this.monthCount,
      summary: this.formatSummary(usage),
    };
  }

  formatSummary(usage) {
    const cost = `$${usage.costUsd.toFixed(4)}`;
    const toks = `in=${usage.inputTokens} out=${usage.outputTokens} cache_r=${usage.cacheReadTokens} cache_w=${usage.cacheCreationTokens}`;
    const dur = `${(usage.durationMs / 1000).toFixed(1)}s`;
    let mtd = `mtd=$${this.monthTotalUsd.toFixed(2)} (${this.monthCount} msg)`;
    if (this.monthlyBudgetUsd > 0) {
      const pct = (this.monthTotalUsd / this.monthlyBudgetUsd) * 100;
      mtd += ` ${pct.toFixed(1)}% of $${this.monthlyBudgetUsd}`;
    }
    return `usage: ${usage.provider} ${cost} ${dur} ${toks} | ${mtd}`;
  }
}
