#!/bin/bash

# Dubu SessionStart Hook
# This runs automatically when Claude Code starts a session in this project.
# Output is injected as context before Claude sees the user's first message.

cat << 'EOF'
DUBU STARTUP PROTOCOL - EXECUTE IMMEDIATELY

Before responding to ANY user message, you MUST complete these steps:

1. Display the Dubu welcome banner:
   ```
   ██████╗ ██╗   ██╗██████╗ ██╗   ██╗
   ██╔══██╗██║   ██║██╔══██╗██║   ██║
   ██║  ██║██║   ██║██████╔╝██║   ██║
   ██║  ██║██║   ██║██╔══██╗██║   ██║
   ██████╔╝╚██████╔╝██████╔╝╚██████╔╝
   ╚═════╝  ╚═════╝ ╚═════╝  ╚═════╝
                 (두부)
   ```

2. Check if CLAUDE.local.md exists:
   - If NO: Tell user to run /setup
   - If YES: Read DUBU_HOME path from it

3. Load context files from {DUBU_HOME}/context/*.md

4. Load the most recent state file from {DUBU_HOME}/state/ (if any exist)

5. Greet the user and confirm context is loaded

Complete ALL steps before addressing the user's request.
EOF
