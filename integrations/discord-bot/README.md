# discord-bot

Minimal Discord bridge that pipes channel messages through a configured agent CLI provider and posts replies back. A stripped-down sibling of the openclaw Discord channel plugin: no slash commands, components, voice, exec approvals, or skill commands. Just messages in, agent out.

## What it does

- Connects to Discord as a bot via [@buape/carbon](https://carbon.buape.com) (WebSocket gateway + REST).
- Listens for messages in configured guild/channel allowlists (and optional DMs).
- For each conversation (per channel or per thread, see [Session model](#session-model)) it spawns the configured provider CLI and resumes the same provider session on follow-ups.
- Replies in the same channel/thread, chunked at the 2000-char Discord limit. Code fences carry across splits.
- Optional reaction acks, message debouncing, and presence caching.

## File layout

```
src/
  index.mjs       entry point: load config, wire components, start bot
  config.mjs      JSON config loader + validator
  paths.mjs       resolves DUBU_HOME + config/state/logs paths for this integration
  sessions.mjs    on-disk thread/channel -> session_id store with idle expiry
  providers.mjs   provider dispatcher for supported agent CLIs
  claude.mjs      spawns `claude` CLI as a subprocess
  codex.mjs       spawns `codex exec` as a subprocess
  chunk.mjs       splits long replies into <=2000-char chunks at safe boundaries
  bot.mjs         Carbon Client + gateway plugin + listener subclasses
  handler.mjs     allowlist + debouncer + ack + provider call + chunked reply
  debouncer.mjs   per-author debouncer with per-key serialization
  reactions.mjs   add/remove own reactions via REST
  presence.mjs    in-memory PresenceUpdate cache (LRU)
  usage.mjs       per-run cost/token logger -> usage.jsonl, month-to-date totals
scripts/
  setup.mjs       creates dubu config/state/logs dirs and seeds discord-bot.json
  usage.mjs       `npm run usage` cost/token report
config.example.json
package.json
```

Runtime config + state live under `{DUBU_HOME}/{config,state,logs}/discord-bot/` (outside the repo). Only `node_modules/` is gitignored inside the integration directory.

## Prerequisites

- Node 20+
- `codex` CLI on `PATH` for the default provider, already authenticated (`codex login`).
- Optional: `claude` CLI on `PATH` if you set `"provider": "claude"` (`claude auth login` or via `ANTHROPIC_API_KEY`).
- A Discord application + bot you control. From the [Developer Portal](https://discord.com/developers/applications):
  1. Create an Application, then a Bot under it.
  2. Copy the **Application ID** (General Information) and the **Bot Token** (Bot tab, Reset Token).
  3. Under Bot > Privileged Gateway Intents, enable:
     - **Message Content Intent** (required - bot needs to read message text)
     - **Presence Intent** (only if you plan to enable `intents.presence` in config)
  4. Invite the bot to your server. OAuth2 > URL Generator: scopes `bot`, permissions `Send Messages`, `Read Message History`, `Add Reactions`, `Use External Emojis`. Open the URL, pick the server.

## Setup

```bash
cd integrations/discord-bot
npm install
npm run setup           # creates {DUBU_HOME}/{config,state,logs}/discord-bot dirs and seeds the config
# edit the seeded config file with real values (path is printed by setup)
npm start
```

`npm run setup` resolves `DUBU_HOME` (env var, then `chung-dubu/CLAUDE.local.md`, then `~/dubu`) and writes:

- Config to `{DUBU_HOME}/config/discord-bot.json` (seeded from `config.example.json` if absent)
- Reserves `{DUBU_HOME}/state/discord-bot/` for `sessions.json` and any future runtime state
- Reserves `{DUBU_HOME}/logs/discord-bot/` for future log files

By default `npm start` loads the config from `{DUBU_HOME}/config/discord-bot.json`. Override with a CLI arg or env var:

```bash
node src/index.mjs /absolute/path/to/config.json
# or
DISCORD_BOT_CONFIG=/path/to/config.json node src/index.mjs
```

See `../README.md` (`integrations/README.md`) for the shared filesystem convention all dubu integrations follow.

## Configuration

`config.json` schema:

```jsonc
{
  "discord": {
    "token": "<bot token>",
    "applicationId": "<application id>",
    "allowedGuilds": {
      "<guild id>": {
        "channels": ["<channel id>", "<channel id>"]   // empty/omitted = all channels in this guild
      }
    },
    "requireMention": false,        // if true, ignore guild messages unless bot is @mentioned. DMs always pass.
    "ack": "on",                    // "on" = react with eyes while thinking, x on error. "off" = no reactions.
    "debounce": {
      "windowMs": 1500,             // coalesce messages from same author+channel within this window
      "maxChars": 400               // messages longer than this skip the debouncer
    },
    "intents": {
      "presence": false             // enable to track user presence (requires privileged intent toggle in Dev Portal)
    }
  },
  "provider": "codex",              // "codex" or "claude"
  "claude": {
    "binary": "claude",
    "permissionMode": "bypassPermissions",  // sent to `claude --permission-mode`
    "model": null,                  // e.g. "sonnet", "opus", or full model id; null = CLI default
    "cwd": null,                    // working dir for claude subprocess; null = project root
    "extraArgs": [],                // additional flags passed before the prompt
    "timeoutMs": 600000             // SIGTERM if claude runs longer than this
  },
  "codex": {
    "binary": "codex",
    "model": null,                  // null = CLI default
    "profile": null,                // optional Codex config profile
    "sandbox": "read-only",         // new sessions only: read-only | workspace-write | danger-full-access
    "cwd": null,                    // working dir for codex subprocess; null = project root
    "config": [],                   // repeated `--config key=value` overrides
    "extraArgs": [],                // additional flags passed before the prompt
    "skipGitRepoCheck": false,
    "dangerouslyBypassApprovalsAndSandbox": false,
    "timeoutMs": 600000             // SIGTERM if codex runs longer than this
  },
  "sessions": {
    // "file" defaults to {DUBU_HOME}/state/discord-bot/sessions.json.
    // Override only if you want a non-standard location.
    "idleHours": 24                 // sessions older than this are dropped on next access
  },
  "usage": {
    // "file" defaults to {DUBU_HOME}/logs/discord-bot/usage.jsonl.
    "monthlyBudgetUsd": 100         // Agent SDK monthly credit, used for % / projection in `npm run usage`
  },
  "log": {
    "level": "info"                 // debug | info | warn | error
  }
}
```

**Allowlist semantics**

- DMs always pass the allowlist (a DM has no `guild_id`).
- For guild messages, the guild must appear in `allowedGuilds`.
- If the guild entry has a `channels` array, only those channel IDs are allowed; an empty/missing `channels` means any channel in that guild.

## Session model

The bot binds one provider conversation to one Discord channel ID.

- A message in a regular channel resumes (or creates) the session for that channel.
- Discord threads have their own channel IDs, so a thread automatically gets its own isolated session.
- Sessions persist to `sessions.json`. After `sessions.idleHours` of inactivity, the next message in that channel starts a fresh session.
- Sessions are provider-aware. If you switch providers, the next message in a channel starts a fresh session for the new provider because Claude session IDs and Codex thread IDs are not interchangeable.

Storage shape:

```json
{
  "version": 1,
  "entries": {
    "<guildId>:<channelId>": { "sessionId": "<uuid>", "provider": "codex", "updatedAt": 1715000000000 }
  }
}
```

To wipe a session, delete its entry from `sessions.json` (or delete the whole file).

## Usage tracking

Every provider invocation appends one record per run to `{DUBU_HOME}/logs/discord-bot/usage.jsonl` and logs a per-message summary line:

```
usage: codex $0.0000 3.2s in=18 out=240 cache_r=11023 cache_w=0 | mtd=$2.14 (61 msg) 2.1% of $100
```

Claude reports `total_cost_usd`; Codex JSONL currently reports token usage but not a per-run dollar cost through this integration, so Codex records default to `$0.0000` unless cost data is added later.

Run a report any time:

```bash
npm run usage
```

It prints this-month / last-7-days / all-time totals, average cost per message, a per-channel breakdown, and a month-end projection vs `usage.monthlyBudgetUsd`. The JSONL file is plain append-only text, so you can also analyze it with `jq` or anything else.

## Reaction acks

When `discord.ack` is `"on"`:

- 👀 added on the most recent message in the batch when the provider starts running.
- 👀 removed once the reply posts.
- ❌ added if the run errors (provider exit code, timeout, or handler exception).

## Debouncer

Coalesces rapid messages from the same author in the same channel into a single provider invocation. Useful when a user sends a thought in 2-3 bursts.

- Key: `guildId:channelId:authorId` (DMs use `dm:channelId:authorId`).
- Window resets on each new message in the key.
- Messages with attachments or stickers, or any single message longer than `maxChars`, skip the debouncer and fire immediately.
- A per-key promise queue serializes flushes, so a second burst that arrives while the provider is still processing the first batch queues neatly instead of racing.
- The combined prompt is `entries.map(e => e.content).join("\n\n")`. The reply targets the last message in the batch.

Set `discord.debounce.windowMs` to `0` to disable debouncing entirely.

## Presence cache

When `discord.intents.presence` is `true`:

- Bot requests the `GuildPresences` privileged intent (must be enabled in the Developer Portal).
- `PresenceUpdate` events populate an in-memory cache, capped LRU at 5000 entries.
- The cache is exposed but not yet consumed by the handler. Use it to add features like "skip @-pings to offline users" or "include presence in a /who reply".

Disable it (the default) if you don't need it - the privileged intent imposes more responsibility and a verification requirement once your bot is in 100+ servers.

## Logging

Plaintext to stdout/stderr with ISO timestamps. Levels: `debug`, `info`, `warn`, `error`. Override with `log.level` in config. Errors and warnings go to stderr; everything else stdout. Wrap with a process supervisor (launchd, systemd, pm2) if you want log files + auto-restart.

## What's not in this POC

Things openclaw does that this intentionally skips:

- Slash commands, components, modals
- Voice channels
- Exec approval buttons
- Skill-as-command auto-registration
- Forum-channel post creation
- Inbound replay-key dedupe across gateway reconnects (rare-edge case)
- Group-DM policies, per-DM allow lists
- Thread auto-binding / auto-renaming
- Markdown table rewriting
- Streaming partial replies

Each is feasible to add later. The most-likely next adds:

- Replay dedupe to survive WS 1006 reconnects without re-processing messages
- Streaming replies (edit a placeholder message as chunks arrive from `--output-format stream-json`)
- `/reset` or reaction-driven session reset (e.g. clear session on 🗑 reaction)

## Troubleshooting

- **`401 Unauthorized` on startup**: bot token is wrong or was rotated. Reset it in the Developer Portal and update `config.json`.
- **`Used disallowed intents`**: you enabled `intents.presence: true` but didn't toggle the Presence Intent in the Developer Portal (or `Message Content Intent` is off).
- **Bot connects but never replies**: check the channel is in `allowedGuilds[guildId].channels`, and that `requireMention` matches how you're addressing it.
- **`codex: command not found`**: set `codex.binary` to an absolute path.
- **`codex exited 1`**: check stderr in the handler log; usually auth (`codex login`), session access, or a model/flag the CLI doesn't recognize.
- **`claude: command not found`**: if using `"provider": "claude"`, set `claude.binary` to an absolute path.
- **`claude exited 1`**: check stderr in the handler log; usually auth (`claude auth login`) or a model/flag the CLI doesn't recognize.
- **Reply is silently truncated**: shouldn't happen with the chunker, but if a single line exceeds 2000 chars with no break opportunity it falls back to a hard split at 2000. Long unbroken strings (URLs, base64) are the usual culprit.

## License

Internal to dubu. No license declared.
