@echo off
REM Dubu Alias Setup Script for Windows
REM Creates 'dubu' and 'dubuhome' aliases for quick navigation
REM This script sets up PowerShell functions in your PowerShell profile

setlocal enabledelayedexpansion

REM Get the script directory and repo root
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

REM Navigate up two directories to get repo root
for %%I in ("%SCRIPT_DIR%\..\.." ) do set "REPO_ROOT=%%~fI"

echo.
echo [INFO] Dubu Alias Setup for Windows
echo [INFO] =============================
echo.

REM Check if CLAUDE.local.md exists
set "CONFIG_FILE=%REPO_ROOT%\CLAUDE.local.md"
if not exist "%CONFIG_FILE%" (
    echo [ERROR] CLAUDE.local.md not found at %CONFIG_FILE%
    echo [INFO] Please run /setup in Dubu first to create your configuration.
    exit /b 1
)

REM Extract DUBU_HOME from CLAUDE.local.md
set "DUBU_HOME="
for /f "tokens=2 delims==" %%a in ('findstr /r /c:"^DUBU_HOME.*=" "%CONFIG_FILE%"') do (
    set "DUBU_HOME=%%a"
)

REM Clean up DUBU_HOME (remove quotes and spaces)
set "DUBU_HOME=%DUBU_HOME: =%"
set "DUBU_HOME=%DUBU_HOME:"=%"

if "%DUBU_HOME%"=="" (
    echo [ERROR] DUBU_HOME not found in CLAUDE.local.md
    echo [INFO] Please run /setup in Dubu to configure your home directory.
    exit /b 1
)

echo [INFO] Detected configuration:
echo   Repository root: %REPO_ROOT%
echo   Dubu home:       %DUBU_HOME%
echo.

REM Check for PowerShell
where powershell >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] PowerShell not found. This script requires PowerShell.
    exit /b 1
)

REM Run the PowerShell setup script
powershell -ExecutionPolicy Bypass -File "%SCRIPT_DIR%\setup-aliases.ps1" -RepoRoot "%REPO_ROOT%" -DubuHome "%DUBU_HOME%"

endlocal
