# End Session Command

End the current Dubu session and optionally save state.

## When `/end` is invoked:

### 1. Summarize Session

Provide a brief summary of what was discussed/accomplished:

```
Session Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Topics discussed:
- {topic 1}
- {topic 2}
- {topic 3}

Actions taken:
- {action 1}
- {action 2}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 2. Offer to Save State

Ask if the user wants to save the session state:

```
Would you like to save this session's state for next time?
This will help me remember our discussion context.

[Yes] / [No]
```

### 3. Save State File (if yes)

Create a state file at `{DUBU_HOME}/state/YYYY-MM-DD_session.md`:

```markdown
# Session State - {date}

## Summary
{Brief summary of session}

## Topics Discussed
- {topic 1}
- {topic 2}

## Key Points
- {important point 1}
- {important point 2}

## Open Items
- {any unfinished tasks or follow-ups}

## Mode
{assistant / agent: agent_name}
```

### 4. Farewell

```
State saved to: {DUBU_HOME}/state/{filename}

Session ended. See you next time!
```

Or if state not saved:
```
Session ended. See you next time!
```

## Notes

- State files help maintain continuity between sessions
- Old state files are preserved (not overwritten)
- The most recent state file is loaded on next startup
