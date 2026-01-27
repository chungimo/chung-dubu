<p align="center">
  <img src="imgs/dubu_logo.png" alt="Dubu Logo" width="400">
</p>
<h1 align="center">Dubu (두부)</h1>

<p align="center">
  <em>A personal AI assistant framework for Claude Code</em>
</p>

---

## About Dubu

**Dubu** means "tofu" in Korean — and like tofu, this framework is simple, versatile, and adaptable. It takes on the flavor of whatever you bring to it.

At its core, Dubu is a configuration layer for Claude Code that gives your AI assistant memory, personality, and structure. Instead of starting fresh every session, Dubu remembers your context, preferences, and previous conversations. Instead of a generic assistant, you get specialized agents tailored to specific tasks.

Whether you're taking notes, planning projects, writing documentation, or just thinking through problems — Dubu adapts to how you work.

> **Why build this?** See [Preface](preface.md) for thoughts on AI-assisted development and the philosophy behind Dubu.

## What Dubu Provides

- **Persistent context** — Dubu remembers information across sessions
- **Specialized agents** — Switch between focused AI roles for different tasks
- **Organized outputs** — Notes, plans, and documents saved to structured folders
- **Session continuity** — Pick up where you left off

## Quick Start

1. **Clone this repo** to your machine
2. **Navigate into the repo** and run `claude`
3. **Run `/setup`** when prompted to configure your environment

```bash
git clone https://github.com/chungimo/chung-dubu
cd chung-dubu
claude
# When Dubu starts, run /setup to complete onboarding
```

### Optional: Shell Aliases

Set up quick-access aliases to launch Dubu from anywhere:

```bash
# macOS / Linux / WSL
./integrations/local/setup-aliases.sh

# Windows (PowerShell)
.\integrations\local\setup-aliases.bat
```

This creates two aliases:
- `dubu` — Navigate to the repo and start Dubu in assistant mode
- `dubuhome` — Navigate to your Dubu home directory

## How It Works

### CLAUDE.md Files

Claude Code reads `CLAUDE.md` files to understand how to behave. This repo uses a hierarchy of these files:

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Main entry point — defines startup behavior, environment checks, and available commands |
| `assistant-mode/CLAUDE.md` | Instructions for conversational assistant behavior |
| `agent-mode/CLAUDE.md` | Instructions for specialized agent roles |

When you run `claude` in this repo, it reads `CLAUDE.md` and follows the instructions to:
1. Check if you've completed setup
2. Load your personal context and previous session state
3. Start in Assistant Mode (or prompt for setup if needed)

### Your Dubu Home Directory

After setup, Dubu creates a personal directory for your data:

- **Windows**: `C:\Users\{username}\Dubu`
- **macOS/Linux**: `~/dubu`

```
~/dubu/
├── context/    # Files loaded on every startup (preferences, projects, etc.)
├── notes/      # Saved notes and discussions
├── plans/      # Project plans
└── state/      # Session state for continuity
```

### Modes

**Assistant Mode** (default)
- Conversational AI assistant
- Remembers your context across sessions
- Helpful for general questions and tasks

**Agent Mode** (via `/agent`)
- Specialized roles: Documentation, Notetaker, Project Planner, Sys Engineer, VP of IT
- Produces structured outputs saved to your Dubu home
- Each agent has specific expertise and output formats

## Commands

| Command | Description |
|---------|-------------|
| `/setup` | First-time setup and configuration |
| `/agent` | Switch to Agent Mode and choose an agent |
| `/help` | Show available commands |
| `/load` | Reload context and state files |
| `/end` | End session and save state |
| `/info` | Show current configuration |

## Directory Structure

```
dubu/
├── CLAUDE.md                 # Main instructions for Claude
├── CLAUDE.local.md           # Your personal config (gitignored)
├── assistant-mode/
│   └── CLAUDE.md             # Assistant mode behavior
├── agent-mode/
│   ├── CLAUDE.md             # Agent mode behavior
│   └── agents/               # Individual agent definitions
├── templates/
│   ├── CLAUDE.local.md.example
│   └── dubu-ai-example/      # Template for user's Dubu home
├── .claude/
│   └── commands/             # Slash command definitions
└── integrations/             # Optional tool integrations
```

## Customization

### Adding Context

Add `.md` files to your `~/dubu/context/` folder. These are loaded automatically on startup:

- `preferences.md` — Communication style, timezone, etc.
- `projects.md` — Current projects and context
- `team.md` — Team members and roles

### Creating Custom Agents

Add new agent files to `agent-mode/agents/` following the existing format. Agents should define:
- Identity and persona
- Mission and purpose
- Output format requirements

---

<p align="center">
  <a href="preface.md">Read the Preface</a> ·
  <a href="agent-mode/">Explore Agents</a> ·
  <a href=".claude/commands/">View Commands</a>
</p>
