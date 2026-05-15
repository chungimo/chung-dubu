const DISCORD_LIMIT = 2000;

export function chunkForDiscord(text, limit = DISCORD_LIMIT) {
  const trimmed = (text ?? "").toString();
  if (trimmed.length === 0) return [];
  if (trimmed.length <= limit) return [trimmed];

  const chunks = [];
  let remaining = trimmed;
  let openFence = null;

  while (remaining.length > 0) {
    if (remaining.length <= limit) {
      chunks.push(carryFence(remaining, openFence));
      break;
    }

    const windowEnd = limit;
    let breakAt = remaining.lastIndexOf("\n\n", windowEnd);
    if (breakAt < limit * 0.5) breakAt = remaining.lastIndexOf("\n", windowEnd);
    if (breakAt < limit * 0.5) breakAt = remaining.lastIndexOf(" ", windowEnd);
    if (breakAt < limit * 0.3) breakAt = windowEnd;

    let piece = remaining.slice(0, breakAt);
    remaining = remaining.slice(breakAt).replace(/^[\n ]+/, "");

    const next = detectOpenFence(piece, openFence);
    const closed = next.openFence ? `${piece}\n\`\`\`` : piece;
    chunks.push(carryFence(closed, openFence));
    openFence = next.openFence;
  }

  return chunks;
}

function carryFence(piece, openFence) {
  if (!openFence) return piece;
  return `\`\`\`${openFence}\n${piece}`;
}

function detectOpenFence(piece, startingFence) {
  let fence = startingFence;
  const lines = piece.split("\n");
  for (const line of lines) {
    const match = line.match(/^```(\S*)\s*$/);
    if (!match) continue;
    if (fence === null) fence = match[1] || "";
    else fence = null;
  }
  return { openFence: fence };
}
