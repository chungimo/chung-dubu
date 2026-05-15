#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { loadConfig } from "../src/config.mjs";
import { currentMonthKey } from "../src/usage.mjs";

function fmtUsd(n) {
  return `$${n.toFixed(2)}`;
}

function fmtTokens(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

async function main() {
  const config = await loadConfig(process.argv[2]);
  const file = config.usage.file;
  const budget = config.usage.monthlyBudgetUsd;

  let raw;
  try {
    raw = await readFile(file, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") {
      console.log(`no usage log yet at ${file}`);
      return;
    }
    throw err;
  }

  const records = [];
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t) continue;
    try {
      records.push(JSON.parse(t));
    } catch {}
  }

  if (records.length === 0) {
    console.log(`usage log is empty (${file})`);
    return;
  }

  const thisMonth = currentMonthKey();
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 86_400_000;

  const acc = () => ({ cost: 0, count: 0, inTok: 0, outTok: 0, cacheR: 0, cacheW: 0, durMs: 0 });
  const add = (a, r) => {
    a.cost += Number(r.costUsd ?? 0) || 0;
    a.count += 1;
    a.inTok += Number(r.inputTokens ?? 0) || 0;
    a.outTok += Number(r.outputTokens ?? 0) || 0;
    a.cacheR += Number(r.cacheReadTokens ?? 0) || 0;
    a.cacheW += Number(r.cacheCreationTokens ?? 0) || 0;
    a.durMs += Number(r.durationMs ?? 0) || 0;
  };

  const all = acc();
  const month = acc();
  const week = acc();
  const byChannel = new Map();

  for (const r of records) {
    add(all, r);
    if (r.month === thisMonth) add(month, r);
    const ts = Date.parse(r.ts);
    if (Number.isFinite(ts) && ts >= sevenDaysAgo) add(week, r);
    const key = r.sessionKey ?? "unknown";
    if (!byChannel.has(key)) byChannel.set(key, acc());
    add(byChannel.get(key), r);
  }

  const printBlock = (label, a) => {
    if (a.count === 0) {
      console.log(`${label}: no messages`);
      return;
    }
    const avg = a.cost / a.count;
    console.log(`${label}:`);
    console.log(`  messages:   ${a.count}`);
    console.log(`  cost:       ${fmtUsd(a.cost)}  (avg ${fmtUsd(avg)}/msg)`);
    console.log(`  tokens:     in ${fmtTokens(a.inTok)}  out ${fmtTokens(a.outTok)}  cache_r ${fmtTokens(a.cacheR)}  cache_w ${fmtTokens(a.cacheW)}`);
    console.log(`  avg time:   ${(a.durMs / a.count / 1000).toFixed(1)}s`);
  };

  console.log(`usage log: ${file}`);
  console.log(`records:   ${records.length}  (since ${records[0].ts})`);
  console.log();
  printBlock(`this month (${thisMonth})`, month);
  if (budget > 0 && month.count > 0) {
    const pct = (month.cost / budget) * 100;
    const remaining = budget - month.cost;
    const projected = month.cost > 0
      ? month.cost * (30 / Math.max(1, new Date().getUTCDate()))
      : 0;
    console.log(`  budget:     ${fmtUsd(month.cost)} / ${fmtUsd(budget)}  (${pct.toFixed(1)}%, ${fmtUsd(remaining)} left)`);
    console.log(`  projected:  ~${fmtUsd(projected)} by month end at current pace`);
  }
  console.log();
  printBlock("last 7 days", week);
  console.log();
  printBlock("all time", all);
  console.log();
  console.log("by channel (all time):");
  const sorted = [...byChannel.entries()].sort((a, b) => b[1].cost - a[1].cost);
  for (const [key, a] of sorted) {
    console.log(`  ${key}: ${a.count} msg, ${fmtUsd(a.cost)} (avg ${fmtUsd(a.cost / a.count)})`);
  }
}

main().catch((err) => {
  console.error(`usage report failed: ${err.stack ?? err.message}`);
  process.exit(1);
});
