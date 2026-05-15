import { runClaude, ClaudeError } from "./claude.mjs";
import { runCodex, CodexError } from "./codex.mjs";

export class ProviderError extends Error {
  constructor(provider, cause) {
    super(cause.message);
    this.name = "ProviderError";
    this.provider = provider;
    this.code = cause.code;
    this.stderr = cause.stderr;
    this.cause = cause;
  }
}

export async function runProvider({ config, prompt, resumeSessionId, signal }) {
  const provider = config.provider;
  try {
    if (provider === "claude") {
      return await runClaude({
        prompt,
        resumeSessionId,
        claudeConfig: config.claude,
        signal,
      });
    }
    if (provider === "codex") {
      return await runCodex({
        prompt,
        resumeSessionId,
        codexConfig: config.codex,
        signal,
      });
    }
  } catch (err) {
    if (err instanceof ClaudeError || err instanceof CodexError) {
      throw new ProviderError(provider, err);
    }
    throw err;
  }

  throw new ProviderError(provider, new Error(`unsupported provider "${provider}"`));
}
