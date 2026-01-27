# Commands

Slash commands for Dubu. These are invoked by typing `/{command}` in the Claude Code interface.

## Available Commands

| Command | File | Description |
|---------|------|-------------|
| `/setup` | `setup.md` | First-time setup and environment configuration |
| `/agent` | `agent.md` | Switch to Agent Mode and list available agents |
| `/help` | `help.md` | Show available commands and usage information |
| `/load` | `load.md` | Reload context and state files |
| `/end` | `end.md` | End session and save state |
| `/info` | `info.md` | Show current Dubu configuration and status |

## How Commands Work

Each `.md` file in this folder defines a slash command. When you type `/{name}`, Claude reads the corresponding `{name}.md` file and follows its instructions.

## Command Structure

Command files contain:
1. **Purpose** — What the command does
2. **Steps** — Instructions Claude follows when the command is invoked
3. **Output format** — How results should be displayed
4. **Error handling** — What to do if something goes wrong

## Creating Custom Commands

Add a new `.md` file to this folder:

```markdown
# My Command

Description of what this command does.

## When `/mycommand` is invoked:

1. First step...
2. Second step...
3. Display results...
```

The command will be available as `/mycommand` (filename without `.md`).

## Directory Structure

```
.claude/
└── commands/
    ├── README.md    # This file
    ├── setup.md     # /setup command
    ├── agent.md     # /agent command
    ├── help.md      # /help command
    ├── load.md      # /load command
    ├── end.md       # /end command
    └── info.md      # /info command
```
