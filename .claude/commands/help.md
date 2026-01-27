# Help Command

Display available Dubu commands and usage information.

## When `/help` is invoked:

Display the following:

```
Dubu (두부) - Personal AI Assistant
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Available Commands:

  /setup    Configure your Dubu environment (first-time setup)
  /agent    Switch to Agent Mode and list available agents
  /load     Reload context and state files
  /end      End session and save state
  /help     Show this help message

Modes:

  Assistant Mode (default)
    Conversational AI assistant that remembers your context
    and helps with general tasks.

  Agent Mode
    Specialized roles for specific tasks:
    - Documentation Agent: Technical documentation
    - Notetaker Agent: Organize notes
    - Project Planner Agent: Plan projects
    - Sys Engineer Agent: Infrastructure tasks
    - VP of IT Agent: Strategic perspective

Your Dubu Home: {DUBU_HOME}
  - context/  : Persistent context (loaded on startup)
  - notes/    : Saved notes and discussions
  - plans/    : Project plans
  - state/    : Session state files

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If CLAUDE.local.md doesn't exist, show:
```
Note: Environment not configured. Run /setup to get started.
```
