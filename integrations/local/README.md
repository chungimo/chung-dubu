# Local Shell Aliases

Quick-access shell aliases to navigate to Dubu from anywhere in your terminal.

## Available Aliases

| Alias | Description |
|-------|-------------|
| `dubu` | Change to the Dubu repo directory and start Dubu in assistant mode |
| `dubuhome` | Change to your Dubu home directory (where notes, context, etc. are stored) |

## Prerequisites

- Dubu must be set up first (run `/setup` in Claude)
- `CLAUDE.local.md` must exist with `DUBU_HOME` configured
- `claude` CLI must be installed and available in your PATH

## Setup

### macOS / Linux / WSL

```bash
cd integrations/local
chmod +x setup-aliases.sh
./setup-aliases.sh
```

The script will:
1. Detect your shell (bash, zsh, or other)
2. Read your `DUBU_HOME` path from `CLAUDE.local.md`
3. Check if aliases already exist (prompts to overwrite if so)
4. Add aliases with comments to your shell profile
5. Configure Claude Code to allow reading from your Dubu directories without prompts

After setup, either restart your terminal or run:
```bash
source ~/.bashrc   # for bash
source ~/.zshrc    # for zsh
```

### Windows (PowerShell)

```powershell
cd integrations\local
.\setup-aliases.bat
```

Or run the PowerShell script directly:
```powershell
.\setup-aliases.ps1 -RepoRoot "C:\path\to\dubu" -DubuHome "C:\Users\You\Dubu"
```

The script will:
1. Read your `DUBU_HOME` path from `CLAUDE.local.md`
2. Check if functions already exist in your PowerShell profile
3. Add functions with comments to your PowerShell profile
4. Configure Claude Code to allow reading from your Dubu directories without prompts

After setup, either restart PowerShell or run:
```powershell
. $PROFILE
```

## Usage

Once set up, use the aliases from any directory:

```bash
# Start a Dubu session
dubu

# Navigate to your Dubu home (notes, context, plans)
dubuhome
```

## What Gets Added

### Shell (bash/zsh)

```bash
# Dubu alias: dubu - Change to Dubu repo and open Claude
alias dubu='cd '/path/to/dubu' && claude'

# Dubu alias: dubuhome - Change to Dubu home directory
alias dubuhome='cd '/home/user/dubu''
```

### PowerShell

```powershell
# Dubu alias: dubu - Change to Dubu repo and open Claude
function dubu {
    Set-Location 'C:\path\to\dubu'
    claude
}

# Dubu alias: dubuhome - Change to Dubu home directory
function dubuhome {
    Set-Location 'C:\Users\You\Dubu'
}
```

## Troubleshooting

### "CLAUDE.local.md not found"
Run `/setup` in Dubu first to create your local configuration.

### "DUBU_HOME not found"
Ensure your `CLAUDE.local.md` contains a line like:
```
DUBU_HOME = "/home/username/dubu"
```

### Aliases not working after setup
Make sure to reload your shell profile or restart your terminal.

### Permission denied (Linux/macOS)
Make the script executable:
```bash
chmod +x setup-aliases.sh
```

### "cannot execute: required file not found" (WSL)
If you cloned the repo on Windows, the script may have Windows line endings. Convert them:
```bash
sed -i 's/\r$//' setup-aliases.sh
```
