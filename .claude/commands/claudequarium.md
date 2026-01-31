# Claudequarium

Configure Claudequarium visualization hooks for the current project.

## When `/claudequarium` is invoked:

1. Read the skill definition from `skills/claudequarium-skill/SKILL.md`
2. Follow the instructions in that file to configure hooks
3. The skill will set up hooks that connect Claude Code sessions to the Claudequarium visualization

## What This Does

Claudequarium shows Claude Code sessions as animated characters:
- **THINKING** (pacing) - when reading, searching, researching
- **CODING** (at desk) - when writing, editing, running commands
- **PLANNING** (at whiteboard) - when planning or managing todos
- **IDLE** (lounging) - when waiting for user input

## Prerequisites

Make sure the game server is running:
```bash
cd claudequarium-server
npm start
```

Then open http://localhost:4000 to see the visualization.
