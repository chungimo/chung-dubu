# Integrations

Optional tool integrations to extend Dubu's capabilities.

## Available Integrations

| Integration | Description |
|-------------|-------------|
| [local](local/) | Shell aliases for quick navigation (`dubu`, `dubuhome`) |
| [parallel-search](parallel-search/) | Web search and URL fetching via MCP |

## How Integrations Work

Integrations connect Dubu to external services and tools through MCP (Model Context Protocol) servers. Each integration:

1. Provides a setup script to configure the connection
2. Adds new capabilities that Dubu can use
3. Works seamlessly with both Assistant and Agent modes

## Adding an Integration

Navigate to the integration folder and run its setup script:

```bash
./integrations/{integration-name}/setup.sh
```

## Creating Custom Integrations

To add a new integration:

1. Create a folder under `integrations/`
2. Add a `setup.sh` script that configures the MCP server
3. Add a `README.md` explaining:
   - What the integration does
   - Prerequisites
   - Setup instructions
   - Available tools/commands
   - Troubleshooting tips

## Directory Structure

```
integrations/
├── README.md              # This file
├── local/                 # Shell alias integration
│   ├── README.md
│   ├── setup-aliases.sh   # Setup script for macOS/Linux/WSL
│   ├── setup-aliases.bat  # Setup script for Windows (calls .ps1)
│   └── setup-aliases.ps1  # PowerShell setup script
└── parallel-search/       # Web search integration
    ├── README.md
    └── setup.sh
```
