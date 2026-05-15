import { spawn } from "node:child_process";

export class CodexError extends Error {
  constructor(message, { code, stderr } = {}) {
    super(message);
    this.name = "CodexError";
    this.code = code;
    this.stderr = stderr;
  }
}

export async function runCodex({ prompt, resumeSessionId, codexConfig, signal }) {
  const args = resumeSessionId
    ? ["exec", "resume", resumeSessionId]
    : ["exec"];

  args.push("--json");
  if (!resumeSessionId && codexConfig.sandbox) args.push("--sandbox", codexConfig.sandbox);
  if (!resumeSessionId && codexConfig.cwd) args.push("--cd", codexConfig.cwd);
  if (codexConfig.model) args.push("--model", codexConfig.model);
  if (!resumeSessionId && codexConfig.profile) args.push("--profile", codexConfig.profile);
  for (const value of codexConfig.config ?? []) args.push("--config", value);
  if (codexConfig.dangerouslyBypassApprovalsAndSandbox) {
    args.push("--dangerously-bypass-approvals-and-sandbox");
  }
  if (codexConfig.skipGitRepoCheck) args.push("--skip-git-repo-check");
  for (const extra of codexConfig.extraArgs) args.push(extra);
  args.push(prompt);

  return await new Promise((resolveRun, rejectRun) => {
    const child = spawn(codexConfig.binary, args, {
      cwd: codexConfig.cwd ?? process.cwd(),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
      signal,
    });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
    }, codexConfig.timeoutMs);

    child.stdout.on("data", (chunk) => { stdout += chunk.toString("utf8"); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString("utf8"); });

    child.on("error", (err) => {
      clearTimeout(timer);
      rejectRun(new CodexError(`failed to spawn codex: ${err.message}`, { stderr }));
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        return rejectRun(new CodexError(`codex exited ${code}`, { code, stderr }));
      }

      let sessionId = resumeSessionId ?? null;
      let text = "";
      let usage = {};
      const events = [];

      for (const line of stdout.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        let event;
        try {
          event = JSON.parse(trimmed);
        } catch (err) {
          return rejectRun(new CodexError(`codex returned non-JSONL: ${err.message}`, { stderr: trimmed.slice(0, 500) }));
        }
        events.push(event);
        if (event.type === "thread.started" && event.thread_id) sessionId = event.thread_id;
        if (event.type === "item.completed" && event.item?.type === "agent_message") {
          text = String(event.item.text ?? "");
        }
        if (event.type === "turn.completed" && event.usage) usage = event.usage;
      }

      if (!sessionId) {
        return rejectRun(new CodexError("codex response missing thread_id", { stderr }));
      }

      resolveRun({
        sessionId,
        text,
        raw: {
          provider: "codex",
          events,
          usage: {
            input_tokens: usage.input_tokens ?? 0,
            output_tokens: usage.output_tokens ?? 0,
            cache_read_input_tokens: usage.cached_input_tokens ?? 0,
            reasoning_output_tokens: usage.reasoning_output_tokens ?? 0,
          },
        },
      });
    });
  });
}
