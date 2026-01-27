# Agent Mode Command

This command switches Dubu to Agent Mode and lists available agents.

## When `/agent` is invoked:

### 1. Read Agent Mode Instructions

First, read `agent-mode/CLAUDE.md` to understand agent loading protocol.

### 2. List Available Agents

Display the available agents from `agent-mode/agents/`:

```
Switching to Agent Mode...

Available Agents:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Documentation Agent
   → Creates technical documentation (READMEs, guides, API docs)

2. Notetaker Agent
   → Organizes notes into structured, searchable output

3. Project Planner Agent
   → Plans and structures projects with actionable steps

4. Sys Engineer Agent
   → Handles systems engineering and infrastructure tasks

5. VP of IT Agent
   → Provides strategic IT leadership perspective

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Which agent would you like to load? (Enter number or name)
```

### 3. Load Selected Agent

When the user selects an agent:

1. **Load user context** from `{DUBU_HOME}/context/` (all `.md` files)
2. **Load repo context** from `agent-mode/context/` (all `.md` files)
3. **Read the agent file** from `agent-mode/agents/{AGENT_FILE}.md`
4. **Assume the role** and confirm:

```
Agent Loaded: {Agent Name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Context loaded:
- User context: {count} files from {DUBU_HOME}/context/
- Repo context: {count} files from agent-mode/context/

I am now operating as the {Agent Name}. {Brief agent description}

How can I help you today?
```

### 4. Agent File Mapping

| Selection | Agent File |
|-----------|------------|
| 1, documentation | `DOCUMENTATION_AGENT.md` |
| 2, notetaker | `NOTETAKER_AGENT.md` |
| 3, project planner, planner | `PROJECT_PLANNER_AGENT.md` |
| 4, sys engineer, syseng | `SYS_ENGINEER_AGENT.md` |
| 5, vp of it, vpit | `VP_OF_IT_AGENT.md` |

### 5. Direct Agent Loading

Users can also specify an agent directly:
- `/agent notetaker` - Load Notetaker directly
- `/agent planner` - Load Project Planner directly
- `/agent vpit` - Load VP of IT directly

### 6. Exiting Agent Mode

Users can exit agent mode by:
- Saying "exit agent mode", "back to assistant", "exit"
- Starting a new topic unrelated to the agent's role

When exiting, confirm:
```
Exiting Agent Mode. Returning to Assistant Mode.
```
