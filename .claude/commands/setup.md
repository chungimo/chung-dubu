# Dubu Setup Command

This command handles first-time setup and onboarding for new Dubu users.

## Setup Protocol

When `/setup` is invoked, follow these steps:

### 1. Check if Already Configured

First, check if `CLAUDE.local.md` exists in the repo root:
- If it exists AND the `DUBU_HOME` folder exists, inform the user they're already set up
- Offer to reconfigure if they want to change settings

### 2. Detect Operating System

Determine the user's OS by checking environment:
- **Windows**: Check for `C:\Users\` paths or `%USERPROFILE%`
- **macOS/Linux**: Check for `~` or `/home/` paths
- **WSL**: Check for `/mnt/c/` paths (treat as Linux-style paths)

### 3. Propose Dubu Home Directory

Suggest the default location based on OS:

| OS | Default Path |
|----|--------------|
| Windows | `C:\Users\{username}\Dubu` |
| macOS | `~/dubu` |
| Linux | `~/dubu` |
| WSL | `~/dubu` |

Ask the user:
> "I'll create your Dubu home directory for storing context, notes, plans, and session state.
> The default location is: `{default_path}`
>
> Would you like to use this location, or specify a different path?"

### 4. Create Directory Structure

Once the path is confirmed, create the following folders:

```
{DUBU_HOME}/
├── context/    # Persistent context loaded on every startup
├── notes/      # Notes from Notetaker agent or saved discussions
├── plans/      # Project plans from Project Planner agent
└── state/      # Session state files for continuity between sessions
```

### 5. Create Welcome Files

Create a welcome file in the context folder:

**File:** `{DUBU_HOME}/context/welcome.md`
```markdown
# Welcome to Dubu

This is your personal context folder. Any `.md` files here will be loaded
automatically when Dubu starts up.

## What to put here

- Personal preferences and working style
- Project context and background information
- Frequently referenced information
- Anything you want Dubu to remember across sessions

## Examples

- `preferences.md` - Your communication preferences, timezone, etc.
- `projects.md` - Current projects you're working on
- `team.md` - Team members and their roles
```

### 6. Create CLAUDE.local.md

Create the local configuration file in the repo root:

**File:** `{REPO_ROOT}/CLAUDE.local.md`

```markdown
# Dubu Local Configuration

This file contains your personal Dubu configuration. It is gitignored.

## Environment

- **OS**: {detected_os}
- **Setup Date**: {current_date}

## Paths

DUBU_HOME = "{user_specified_path}"

## Personal Preferences

Add any personal instructions for Dubu here:

```

### 7. Verify Setup

After creating everything:
1. Confirm the folder structure was created successfully
2. Confirm CLAUDE.local.md was created
3. Inform the user they're ready to use Dubu

### 8. Welcome Message

Display:
> "Setup complete! Your Dubu home is at: `{DUBU_HOME}`
>
> You can now use Dubu in assistant mode or type `/agent` to see available agents. 
> Type `/help` to see available commands.
>
> To customize your experience, add context files to `{DUBU_HOME}/context/`."

## Reconfiguration

If the user wants to reconfigure:
1. Ask for the new DUBU_HOME path
2. Offer to migrate existing files (if any)
3. Update CLAUDE.local.md with new path
4. Verify new location

## Error Handling

- If unable to create directories, inform user and suggest manual creation
- If CLAUDE.local.md can't be written, provide the content to paste manually
- Always verify paths exist after creation
