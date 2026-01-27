# Templates

Configuration templates and example structures for Dubu setup.

## Contents

### CLAUDE.local.md.example

A template for your personal configuration file. During setup, this is customized and copied to `CLAUDE.local.md` in the repo root.

The local config stores:
- Your OS type
- Your Dubu home directory path (`DUBU_HOME`)
- Personal preferences

### dubu-ai-example/

The folder structure template for your Dubu home directory. During `/setup`, this structure is created at your configured location (default: `~/dubu` or `C:\Users\{username}\Dubu`).

```
dubu-ai-example/
├── context/     # Persistent context files (loaded on every startup)
│   └── welcome.md
├── notes/       # Saved notes and discussions
├── plans/       # Project plans from Project Planner agent
└── state/       # Session state for continuity
```

## How Templates Are Used

When you run `/setup`:

1. Dubu detects your OS
2. Asks for your preferred Dubu home location
3. Creates the folder structure based on `dubu-ai-example/`
4. Creates `CLAUDE.local.md` in the repo based on `CLAUDE.local.md.example`

## Customizing Templates

If you want to change the default setup:

- Edit `CLAUDE.local.md.example` to add default preferences
- Add files to `dubu-ai-example/context/` to include starter context
- Modify folder structure in `dubu-ai-example/` as needed

Changes here affect new setups only, not existing configurations.
