#!/bin/bash
#
# Dubu Alias Setup Script
# Creates 'dubu' and 'dubuhome' aliases for quick navigation
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the repo root (parent of integrations/local)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to extract DUBU_HOME from CLAUDE.local.md
get_dubu_home() {
    local config_file="$REPO_ROOT/CLAUDE.local.md"

    if [[ ! -f "$config_file" ]]; then
        print_error "CLAUDE.local.md not found at $config_file"
        print_info "Please run /setup in Dubu first to create your configuration."
        exit 1
    fi

    # Extract DUBU_HOME value (handles both quoted and unquoted paths)
    local dubu_home=$(grep -E '^DUBU_HOME\s*=' "$config_file" | head -1 | sed 's/.*=\s*"\?\([^"]*\)"\?.*/\1/' | tr -d ' ')

    if [[ -z "$dubu_home" ]]; then
        print_error "DUBU_HOME not found in CLAUDE.local.md"
        print_info "Please run /setup in Dubu to configure your home directory."
        exit 1
    fi

    echo "$dubu_home"
}

# Function to detect the user's shell profile
detect_shell_profile() {
    local shell_name=$(basename "$SHELL")

    case "$shell_name" in
        zsh)
            if [[ -f "$HOME/.zshrc" ]]; then
                echo "$HOME/.zshrc"
            else
                echo "$HOME/.zprofile"
            fi
            ;;
        bash)
            if [[ -f "$HOME/.bashrc" ]]; then
                echo "$HOME/.bashrc"
            elif [[ -f "$HOME/.bash_profile" ]]; then
                echo "$HOME/.bash_profile"
            else
                echo "$HOME/.profile"
            fi
            ;;
        *)
            # Default to .profile for other shells
            echo "$HOME/.profile"
            ;;
    esac
}

# Function to check if an alias already exists in the profile
alias_exists() {
    local profile="$1"
    local alias_name="$2"

    if [[ -f "$profile" ]]; then
        grep -q "^alias $alias_name=" "$profile" 2>/dev/null
        return $?
    fi
    return 1
}

# Function to remove existing alias from profile
remove_alias() {
    local profile="$1"
    local alias_name="$2"

    # Create temp file and remove the alias line and its comment
    local temp_file=$(mktemp)
    grep -v "^# Dubu alias: $alias_name" "$profile" | grep -v "^alias $alias_name=" > "$temp_file"
    mv "$temp_file" "$profile"
}

# Function to add alias to profile
add_alias() {
    local profile="$1"
    local alias_name="$2"
    local alias_command="$3"
    local description="$4"

    echo "" >> "$profile"
    echo "# Dubu alias: $alias_name - $description" >> "$profile"
    echo "alias $alias_name='$alias_command'" >> "$profile"
}

# Function to prompt user for overwrite confirmation
confirm_overwrite() {
    local alias_name="$1"

    while true; do
        read -p "Alias '$alias_name' already exists. Overwrite? (y/n): " yn
        case $yn in
            [Yy]* ) return 0;;
            [Nn]* ) return 1;;
            * ) echo "Please answer y or n.";;
        esac
    done
}

# Main script
main() {
    print_info "Dubu Alias Setup"
    print_info "================"
    echo ""

    # Get paths
    DUBU_HOME=$(get_dubu_home)
    PROFILE=$(detect_shell_profile)

    print_info "Detected configuration:"
    echo "  Repository root: $REPO_ROOT"
    echo "  Dubu home:       $DUBU_HOME"
    echo "  Shell profile:   $PROFILE"
    echo ""

    # Define aliases
    DUBU_ALIAS_CMD="cd '$REPO_ROOT' && claude 'Initialize'"
    DUBU_ALIAS_DESC="Change to Dubu repo and start Dubu"

    DUBUHOME_ALIAS_CMD="cd '$DUBU_HOME'"
    DUBUHOME_ALIAS_DESC="Change to Dubu home directory"

    # Track if we made changes
    changes_made=false

    # Handle 'dubu' alias
    if alias_exists "$PROFILE" "dubu"; then
        print_warn "Alias 'dubu' already exists in $PROFILE"
        if confirm_overwrite "dubu"; then
            remove_alias "$PROFILE" "dubu"
            add_alias "$PROFILE" "dubu" "$DUBU_ALIAS_CMD" "$DUBU_ALIAS_DESC"
            print_info "Alias 'dubu' has been updated."
            changes_made=true
        else
            print_info "Skipping 'dubu' alias."
        fi
    else
        add_alias "$PROFILE" "dubu" "$DUBU_ALIAS_CMD" "$DUBU_ALIAS_DESC"
        print_info "Alias 'dubu' has been added."
        changes_made=true
    fi

    # Handle 'dubuhome' alias
    if alias_exists "$PROFILE" "dubuhome"; then
        print_warn "Alias 'dubuhome' already exists in $PROFILE"
        if confirm_overwrite "dubuhome"; then
            remove_alias "$PROFILE" "dubuhome"
            add_alias "$PROFILE" "dubuhome" "$DUBUHOME_ALIAS_CMD" "$DUBUHOME_ALIAS_DESC"
            print_info "Alias 'dubuhome' has been updated."
            changes_made=true
        else
            print_info "Skipping 'dubuhome' alias."
        fi
    else
        add_alias "$PROFILE" "dubuhome" "$DUBUHOME_ALIAS_CMD" "$DUBUHOME_ALIAS_DESC"
        print_info "Alias 'dubuhome' has been added."
        changes_made=true
    fi

    echo ""

    # Configure Claude Code permissions
    print_info "Configuring Claude Code permissions..."
    if command -v claude &> /dev/null; then
        # Allow reading from dubu home and repo without prompts
        claude config add allowedTools "Read($DUBU_HOME/**)" 2>/dev/null && \
            print_info "Added read permission for $DUBU_HOME" || \
            print_warn "Could not add read permission (may already exist)"

        claude config add allowedTools "Read($REPO_ROOT/**)" 2>/dev/null && \
            print_info "Added read permission for $REPO_ROOT" || \
            print_warn "Could not add read permission (may already exist)"
    else
        print_warn "Claude CLI not found. Skipping permissions setup."
        print_info "Run manually after installing Claude: claude config add allowedTools \"Read($DUBU_HOME/**)\""
    fi

    echo ""

    if $changes_made; then
        print_info "Setup complete!"
        echo ""
        echo "To use the aliases immediately, run:"
        echo "  source $PROFILE"
        echo ""
        echo "Or restart your terminal."
        echo ""
        echo "Available aliases:"
        echo "  dubu     - Change to Dubu repo and start Dubu"
        echo "  dubuhome - Change to your Dubu home directory ($DUBU_HOME)"
    else
        print_info "No changes were made."
    fi
}

main "$@"
