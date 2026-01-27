# Dubu Alias Setup Script for Windows PowerShell
# Creates 'dubu' and 'dubuhome' functions for quick navigation

param(
    [Parameter(Mandatory=$true)]
    [string]$RepoRoot,

    [Parameter(Mandatory=$true)]
    [string]$DubuHome
)

# Colors for output
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] " -ForegroundColor Green -NoNewline
    Write-Host $Message
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] " -ForegroundColor Yellow -NoNewline
    Write-Host $Message
}

function Write-Err {
    param([string]$Message)
    Write-Host "[ERROR] " -ForegroundColor Red -NoNewline
    Write-Host $Message
}

# Get PowerShell profile path
$ProfilePath = $PROFILE.CurrentUserAllHosts
$ProfileDir = Split-Path -Parent $ProfilePath

Write-Info "PowerShell profile: $ProfilePath"
Write-Host ""

# Create profile directory if it doesn't exist
if (!(Test-Path $ProfileDir)) {
    Write-Info "Creating profile directory: $ProfileDir"
    New-Item -ItemType Directory -Path $ProfileDir -Force | Out-Null
}

# Create profile file if it doesn't exist
if (!(Test-Path $ProfilePath)) {
    Write-Info "Creating new PowerShell profile"
    New-Item -ItemType File -Path $ProfilePath -Force | Out-Null
}

# Read current profile content
$ProfileContent = Get-Content $ProfilePath -Raw -ErrorAction SilentlyContinue
if ($null -eq $ProfileContent) {
    $ProfileContent = ""
}

# Function definitions to add
$DubuFunction = @"

# Dubu alias: dubu - Change to Dubu repo and start Claude
function dubu {
    Set-Location '$RepoRoot'
    claude
}
"@

$DubuHomeFunction = @"

# Dubu alias: dubuhome - Change to Dubu home directory
function dubuhome {
    Set-Location '$DubuHome'
}
"@

# Check if functions already exist
$DubuExists = $ProfileContent -match "function dubu\s*\{"
$DubuHomeExists = $ProfileContent -match "function dubuhome\s*\{"

$ChangesMade = $false

# Handle 'dubu' function
if ($DubuExists) {
    Write-Warn "Function 'dubu' already exists in PowerShell profile"
    $response = Read-Host "Overwrite? (y/n)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        # Remove existing function (including comment)
        $ProfileContent = $ProfileContent -replace "(?ms)# Dubu alias: dubu[^\n]*\n?function dubu\s*\{[^}]*\}\s*", ""
        $ProfileContent = $ProfileContent.TrimEnd() + $DubuFunction
        Write-Info "Function 'dubu' has been updated."
        $ChangesMade = $true
    } else {
        Write-Info "Skipping 'dubu' function."
    }
} else {
    $ProfileContent = $ProfileContent.TrimEnd() + $DubuFunction
    Write-Info "Function 'dubu' has been added."
    $ChangesMade = $true
}

# Handle 'dubuhome' function
if ($DubuHomeExists) {
    Write-Warn "Function 'dubuhome' already exists in PowerShell profile"
    $response = Read-Host "Overwrite? (y/n)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        # Remove existing function (including comment)
        $ProfileContent = $ProfileContent -replace "(?ms)# Dubu alias: dubuhome[^\n]*\n?function dubuhome\s*\{[^}]*\}\s*", ""
        $ProfileContent = $ProfileContent.TrimEnd() + $DubuHomeFunction
        Write-Info "Function 'dubuhome' has been updated."
        $ChangesMade = $true
    } else {
        Write-Info "Skipping 'dubuhome' function."
    }
} else {
    $ProfileContent = $ProfileContent.TrimEnd() + $DubuHomeFunction
    Write-Info "Function 'dubuhome' has been added."
    $ChangesMade = $true
}

# Write updated profile
if ($ChangesMade) {
    Set-Content -Path $ProfilePath -Value $ProfileContent.TrimEnd()
}

# Configure Claude Code permissions
Write-Host ""
Write-Info "Configuring Claude Code permissions..."

$claudeCmd = Get-Command claude -ErrorAction SilentlyContinue
if ($claudeCmd) {
    # Allow reading from dubu home and repo without prompts
    try {
        & claude config add allowedTools "Read($DubuHome/**)" 2>$null
        Write-Info "Added read permission for $DubuHome"
    } catch {
        Write-Warn "Could not add read permission (may already exist)"
    }

    try {
        & claude config add allowedTools "Read($RepoRoot/**)" 2>$null
        Write-Info "Added read permission for $RepoRoot"
    } catch {
        Write-Warn "Could not add read permission (may already exist)"
    }
} else {
    Write-Warn "Claude CLI not found. Skipping permissions setup."
    Write-Info "Run manually after installing Claude: claude config add allowedTools `"Read($DubuHome/**)`""
}

Write-Host ""

if ($ChangesMade) {
    Write-Info "Setup complete!"
    Write-Host ""
    Write-Host "To use the functions immediately, run:"
    Write-Host "  . `$PROFILE" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Or restart your PowerShell terminal."
    Write-Host ""
    Write-Host "Available commands:"
    Write-Host "  dubu     - Change to Dubu repo and start Claude"
    Write-Host "  dubuhome - Change to your Dubu home directory ($DubuHome)"
} else {
    Write-Info "No changes were made to shell profile."
}
