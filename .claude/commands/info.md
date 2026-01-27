# Info Command

Display current Dubu configuration and status.

## When `/info` is invoked:

### 1. Check Configuration

Read CLAUDE.local.md and display current configuration:

```
Dubu Configuration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Environment:
  OS:           {detected_os}
  Setup Date:   {date from CLAUDE.local.md}
  Repo Path:    {current repo path}

Paths:
  DUBU_HOME:    {configured path}

Dubu Home Contents:
  context/      {count} files
  notes/        {count} files
  plans/        {count} files
  state/        {count} files

Current Mode:   {Assistant / Agent: name}

Last State:     {filename or "None"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 2. If Not Configured

If CLAUDE.local.md doesn't exist:

```
Dubu Configuration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Status: NOT CONFIGURED

Run /setup to configure your Dubu environment.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 3. Optional: List Context Files

If user asks for more detail, list the context files:

```
Context Files:
  - preferences.md
  - projects.md
  - team.md
```

## Use Cases

- Verify Dubu is configured correctly
- Check what context is loaded
- See current mode and state
- Troubleshoot configuration issues
