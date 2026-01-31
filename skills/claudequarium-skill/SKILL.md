---
name: claudequarium
description: Spawns a character in the Claudequarium visualization that reflects Claude's activity during this session.
user-invocable: true
---

# Claudequarium Integration

This skill spawns an animated character in the Claudequarium visualization that reflects what Claude is doing during the session.

## What This Skill Does

When you run `/claudequarium`, Claude will:

1. **Spawn** a character in the visualization
2. **Update state** throughout the session based on activity:
   - THINKING - when reading, searching, exploring
   - CODING - when writing, editing, running commands
   - PLANNING - when using todos or plan mode
   - IDLE - when waiting for user input
3. **Despawn** the character when the user ends the session or says goodbye

---

## Instructions for Claude

**IMPORTANT:** Do NOT modify settings.json or add hooks. This skill works by making direct API calls during the session.

### When This Skill Is Invoked

1. **Check if the server is running** by making a test request:
   ```bash
   curl -s http://localhost:4000/api/state
   ```
   If this fails, tell the user to start the server first (see "Starting the Server" below).

2. **Spawn an entity** for this session:
   ```bash
   curl -s -X POST http://localhost:4000/api/spawn \
     -H "Content-Type: application/json" \
     -d '{"session_id": "<SESSION_ID>"}'
   ```
   Use the current session ID or generate a unique identifier.

3. **Save the entity_id** from the response. You'll need it for state updates.

4. **Confirm to the user** that their character has spawned and tell them to open http://localhost:4000 in a browser to see it.

### During the Session

Update the entity state based on what you're doing:

```bash
curl -s -X POST http://localhost:4000/api/state \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "<ENTITY_ID>", "state": "<STATE>"}'
```

**State mapping:**
| Activity | State |
|----------|-------|
| Reading files, searching, exploring codebase | THINKING |
| Writing, editing files, running bash commands | CODING |
| Using TodoWrite, planning, organizing | PLANNING |
| Waiting for user, asking questions | IDLE |

You don't need to update state on every single tool call - just when the activity type changes.

### When the Session Ends

When the user says goodbye, ends the conversation, or explicitly asks to disconnect:

```bash
curl -s -X POST http://localhost:4000/api/despawn \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "<ENTITY_ID>"}'
```

---

## Starting the Server

The Claudequarium server must be running before using this skill.

**Location:** The server is in the `claudequarium-server` directory relative to this skill, or may be at:
- `D:/chung/gitstuff/chung-claudequarium/claudequarium-server/`

**To start:**
```bash
cd <path-to-claudequarium-server>
npm start
```

**To view:** Open http://localhost:4000 in a browser.

---

## API Reference

| Endpoint | Method | Body | Description |
|----------|--------|------|-------------|
| `/api/spawn` | POST | `{"session_id": "..."}` | Spawns entity, returns `{"entity_id": "..."}` |
| `/api/state` | POST | `{"entity_id": "...", "state": "..."}` | Updates entity state |
| `/api/despawn` | POST | `{"entity_id": "..."}` | Removes entity |

**Valid states:** `THINKING`, `CODING`, `PLANNING`, `IDLE`

---

## Configuration

Environment variable:
- `CLAUDEQUARIUM_SERVER`: Game server URL (default: `http://localhost:4000`)

---

## Files

```
claudequarium-skill/
├── SKILL.md                    # This file
└── hooks/                      # Shell scripts (for manual hook setup only)
    ├── session-start.sh
    ├── tool-use.sh
    ├── stop.sh
    └── session-end.sh
```

## Manual Hook Setup (Alternative)

If you want automatic state updates without invoking the skill each session, you can manually add hooks to your project's `.claude/settings.json`. See the shell scripts in the `hooks/` directory for the implementation.
