# Load Command

Manually reload context and state files.

## When `/load` is invoked:

### 1. Verify Configuration

Check that CLAUDE.local.md exists and DUBU_HOME is configured.
If not configured, prompt user to run `/setup` first.

### 2. Reload Context Files

Read all `.md` files from `{DUBU_HOME}/context/`:

```
Reloading context files...

Loading from {DUBU_HOME}/context/:
  ✓ preferences.md
  ✓ projects.md
  ✓ team.md
  ... (list all files)

Loaded {count} context files.
```

### 3. Reload Latest State

Find and load the most recent state file from `{DUBU_HOME}/state/`:

```
Loading latest state...

Found: {DUBU_HOME}/state/2026-01-24_session.md
State loaded from previous session.
```

If no state files exist:
```
No previous state files found. Starting fresh.
```

### 4. Confirm Reload

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Context and state reloaded successfully.

Context files: {count}
State: {state_file_name or "None"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Use Cases

- After manually adding files to context folder
- To refresh context mid-session
- When switching between projects
- After editing context files externally
