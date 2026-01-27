# Assistant Mode

The default conversational mode for Dubu.

## What is Assistant Mode?

Assistant Mode is Dubu's default state — a helpful, context-aware AI assistant that remembers your preferences and past sessions.

## How It Works

When Dubu starts, it:
1. Reads your personal context from `~/dubu/context/`
2. Loads the most recent session state from `~/dubu/state/`
3. Enters Assistant Mode, ready to help

## What CLAUDE.md Does

The `CLAUDE.md` file in this folder defines Assistant Mode behavior:

- **Context awareness** — Uses loaded files to provide personalized responses
- **Session continuity** — Remembers what was discussed in previous sessions
- **Information saving** — Offers to save important information to your context or notes folders
- **Mode switching** — Knows how to transition to Agent Mode when requested

## Capabilities

In Assistant Mode, Dubu can:

- Answer questions using your loaded context
- Help with general tasks and discussions
- Offer to remember important information for future sessions
- Switch to specialized agents when you need focused work
- Save session state when you end your session

## Saving Information

When you share something worth remembering, Dubu can save it:

| Type | Location | Example |
|------|----------|---------|
| Context | `~/dubu/context/{topic}.md` | Preferences, project info |
| Notes | `~/dubu/notes/YYYY-MM-DD_{topic}.md` | Meeting notes, discussions |
| State | `~/dubu/state/YYYY-MM-DD_session.md` | Session summary for continuity |

## Switching to Agent Mode

Type `/agent` or ask Dubu to assume a specific agent role:

```
/agent
/agent notetaker
"Can you switch to the project planner?"
```

## Directory Structure

```
assistant-mode/
├── CLAUDE.md    # Instructions for Assistant Mode behavior
└── README.md    # This file
```
