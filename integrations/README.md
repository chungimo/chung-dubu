# Integrations

Optional tool integrations to extend Dubu's capabilities.

## Available Integrations

| Integration | Description |
|-------------|-------------|
| [local](local/) | Shell aliases for quick navigation (`dubu`, `dubuhome`) |
| [discord-bot](discord-bot/) | Discord channel bridge that pipes messages through a configured agent CLI provider |

## How Integrations Work

Integrations connect Dubu to external services and tools. Each integration:

1. Provides a setup script to configure the connection
2. Adds new capabilities that Dubu can use
3. Works seamlessly with both Assistant and Agent modes
4. Follows the [shared filesystem convention](#shared-filesystem-convention) for configs, state, and logs

## Adding an Integration

Navigate to the integration folder and run its setup. For Node integrations:

```bash
cd integrations/{integration-name}
npm install
npm run setup     # creates dubu config/state/logs dirs and seeds a default config
# edit the seeded config file as instructed
npm start
```

For shell-only integrations, run the integration's `setup-*` script directly.

## Shared Filesystem Convention

All integrations resolve their configs, runtime state, and logs under the user's `DUBU_HOME`:

```
{DUBU_HOME}/
├── config/                          # User-editable per-integration configs
│   ├── discord-bot.json
│   └── <integration>.json
├── state/                           # Runtime state (sessions, caches, etc.)
│   └── <integration>/
└── logs/                            # Logs (if the integration writes them)
    └── <integration>/
```

`DUBU_HOME` is resolved in this order:

1. `process.env.DUBU_HOME`
2. The `DUBU_HOME = "..."` line in `chung-dubu/CLAUDE.local.md`
3. `~/dubu` (default on macOS/Linux), `%USERPROFILE%\Dubu` (Windows)

To move all integration state to a different location (e.g. `~/Documents/dubu`), update `DUBU_HOME` in `CLAUDE.local.md` — every integration will pick it up.

The `discord-bot` integration ships a small helper at `discord-bot/src/paths.mjs` that implements this lookup. New Node integrations can import it (or copy it) and use the same `configPath(name)` / `statePath(name, ...)` / `logsPath(name, ...)` helpers.

## Creating Custom Integrations

To add a new integration:

1. Create a folder under `integrations/<name>/`.
2. Resolve config from `{DUBU_HOME}/config/<name>.json` (use `paths.mjs` or its equivalent).
3. Write state to `{DUBU_HOME}/state/<name>/` and logs to `{DUBU_HOME}/logs/<name>/`.
4. Ship a setup script (`npm run setup` or `setup.sh`) that creates those dirs and seeds the config from an example.
5. Add a `README.md` covering: what it does, prerequisites, setup, config schema, troubleshooting.
6. Add an entry to the table at the top of this file.

## Directory Structure

```
integrations/
├── README.md
├── local/                           # Shell alias integration
│   ├── README.md
│   ├── setup-aliases.sh
│   ├── setup-aliases.bat
│   └── setup-aliases.ps1
└── discord-bot/                     # Discord -> agent CLI bridge
    ├── README.md
    ├── package.json
    ├── config.example.json
    ├── src/                         # Node source (paths.mjs, config.mjs, ...)
    └── scripts/setup.mjs            # creates dubu dirs + seeds config
```
