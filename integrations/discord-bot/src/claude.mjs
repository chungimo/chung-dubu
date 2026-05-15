import { spawn } from "node:child_process";

export class ClaudeError extends Error {
  constructor(message, { code, stderr } = {}) {
    super(message);
    this.name = "ClaudeError";
    this.code = code;
    this.stderr = stderr;
  }
}

export async function runClaude({ prompt, resumeSessionId, claudeConfig, signal }) {
  const args = [
    "-p",
    "--output-format", "json",
    "--permission-mode", claudeConfig.permissionMode,
  ];
  if (claudeConfig.model) args.push("--model", claudeConfig.model);
  if (resumeSessionId) args.push("--resume", resumeSessionId);
  for (const extra of claudeConfig.extraArgs) args.push(extra);
  args.push(prompt);

  return await new Promise((resolveRun, rejectRun) => {
    const child = spawn(claudeConfig.binary, args, {
      cwd: claudeConfig.cwd ?? process.cwd(),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
      signal,
    });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
    }, claudeConfig.timeoutMs);

    child.stdout.on("data", (chunk) => { stdout += chunk.toString("utf8"); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString("utf8"); });

    child.on("error", (err) => {
      clearTimeout(timer);
      rejectRun(new ClaudeError(`failed to spawn claude: ${err.message}`, { stderr }));
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        return rejectRun(new ClaudeError(`claude exited ${code}`, { code, stderr }));
      }
      let payload;
      try {
        payload = JSON.parse(stdout);
      } catch (err) {
        return rejectRun(new ClaudeError(`claude returned non-JSON: ${err.message}`, { stderr: stdout.slice(0, 500) }));
      }
      const text = payload.result ?? payload.message ?? "";
      const sessionId = payload.session_id ?? payload.sessionId ?? null;
      if (!sessionId) {
        return rejectRun(new ClaudeError("claude response missing session_id", { stderr }));
      }
      resolveRun({ sessionId, text: String(text), raw: payload });
    });
  });
}
