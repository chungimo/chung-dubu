# Agent Mode

Specialized AI agents for focused, task-specific work.

## What is Agent Mode?

Agent Mode transforms Dubu into specialized personas, each with unique expertise:

| Agent | Purpose |
|-------|---------|
| Documentation | Create technical documentation (READMEs, guides, API docs) |
| Notetaker | Organize conversations into structured notes |
| Project Planner | Plan projects with actionable steps and milestones |
| Sys Engineer | Systems engineering and infrastructure tasks |
| VP of IT | Strategic IT leadership perspective |

## How to Use

Type `/agent` to see available agents and select one, or specify directly:

```
/agent notetaker
/agent planner
```

## What CLAUDE.md Does

The `CLAUDE.md` file in this folder tells Claude how to behave in Agent Mode:

1. **Load context first** — Reads your personal context from `~/dubu/context/` plus any shared repo context
2. **Assume the role** — Reads the agent file and adopts that persona
3. **Save outputs properly** — Routes documents to the correct folder in your Dubu home

## Directory Structure

```
agent-mode/
├── CLAUDE.md           # Instructions for Agent Mode behavior
├── README.md           # This file
└── agents/             # Individual agent definitions
    ├── DOCUMENTATION_AGENT.md
    ├── NOTETAKER_AGENT.md
    ├── PROJECT_PLANNER_AGENT.md
    ├── SYS_ENGINEER_AGENT.md
    └── VP_OF_IT_AGENT.md
```

## Output Locations

When agents produce documents, they're saved to your Dubu home directory:

| Agent | Saves To |
|-------|----------|
| Notetaker | `~/dubu/notes/` |
| Project Planner | `~/dubu/plans/` |
| Documentation | Project repo or `~/dubu/notes/` |
| Sys Engineer | Project repo or `~/dubu/plans/` |
| VP of IT | `~/dubu/notes/` |

## Output Naming

Files follow the format: `YYYY-MM-DD_{topic}_{agent}.md`

Examples:
- `2026-01-24_meeting-notes_notetaker.md`
- `2026-01-24_infrastructure-plan_projectplanner.md`

## Creating Custom Agents

Add a new `.md` file to `agents/` with:

1. **Identity** — Who the agent is
2. **Mission** — What they're meant to accomplish
3. **Instructions** — How they should behave
4. **Output format** — Structure for their documents

See existing agent files for examples.

## Exiting Agent Mode

Say "exit agent mode", "back to assistant", or "exit" to return to Assistant Mode.
