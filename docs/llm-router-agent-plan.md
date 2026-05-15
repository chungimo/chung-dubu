# Dubu LLM Router Agent Plan

## Purpose

Dubu started as a personal wrapper and operating layer for Claude Code. The next direction is to evolve it into a portable terminal agent that can front multiple LLM backends while keeping Dubu's memory, skills, tools, and workflow conventions centralized.

The goal is not to clone OpenClaw's complexity. The goal is a smaller, pragmatic agent router:

- one `dubu` command that can run anywhere
- provider adapters for Claude, Codex, and API-based models
- centralized memory, skills, toolbox, and session state
- explicit provider switching first, then policy-based routing later
- portable install across macOS, Linux, Windows, and WSL

## Design Position

Dubu should own the durable user experience. LLM providers should be replaceable execution backends.

That means Dubu should not become a thin command multiplexer like:

```bash
dubu claude ...
dubu codex ...
```

Instead, Dubu should become the stable command surface:

```bash
dubu "do the work"
dubu ask "think through this design"
dubu code "fix the failing tests"
dubu task "summarize this and create a follow-up"
dubu --provider claude plan
dubu --provider codex edit
```

The user should be able to change providers without losing memory, skills, or tool configuration.

## Core Architecture

```text
dubu
  cli
  core runtime
  provider adapters
    claude
    codex
    openai
    anthropic
    local/openrouter/etc
  memory manager
  skill loader
  tool broker
  session manager
  routing policy
```

### Core Runtime

The runtime owns behavior that should remain consistent no matter which model is active:

- config loading
- project detection
- memory lookup
- skill selection
- command/session logging
- tool permission policy
- provider selection
- transcript persistence
- workspace conventions

The runtime should avoid provider-specific assumptions.

### Provider Adapters

Each provider adapter translates Dubu's internal request format into the provider's interface.

Initial adapters:

- Claude CLI or Anthropic API
- Codex CLI or OpenAI API

Future adapters:

- OpenRouter
- local models
- other hosted model APIs

Adapters should declare capabilities instead of pretending all providers behave the same.

Example capability model:

```ts
interface LlmProvider {
  name: string;
  capabilities: {
    streaming: boolean;
    toolCalling: boolean;
    fileEditing: boolean;
    resumableSessions: boolean;
    structuredOutput: boolean;
  };

  send(input: AgentRequest): Promise<AgentResponse>;
}
```

This lets Dubu route intelligently:

- Claude for planning or prose-heavy work
- Codex for repo edits and patch-oriented work
- cheaper models for summarization, search ranking, or cleanup
- explicit user-selected provider when requested

## Memory Layout

Dubu should keep global memory under `DUBU_HOME`, with project-local overrides when available.

Recommended default:

```text
~/.dubu/
  config.yaml
  memory/
    global.md
    projects/
    entities/
    summaries/
  skills/
  tools/
  sessions/
  logs/
```

Project-local optional layout:

```text
.dubu/
  config.yaml
  memory.md
  skills/
```

Memory load order should be predictable:

1. built-in Dubu operating instructions
2. global user memory
3. project memory
4. selected skill instructions
5. current session context

## Skill System

Skills should be provider-neutral whenever possible. A skill should describe the workflow and constraints, not depend on a specific LLM unless that dependency is real.

Example:

```yaml
---
name: deploy-check
description: Validate deploy readiness for an infrastructure change.
tools:
  - shell
  - git
  - clickup
providers:
  preferred: codex
---
```

Skills should support:

- metadata/frontmatter
- invocation hints
- required or optional tools
- provider preferences
- local scripts/assets/templates
- project-level overrides

## Tool Broker

Dubu should own tool execution. Providers should request actions; Dubu should validate and run them.

```text
LLM requests tool call
Dubu checks policy
Dubu asks for approval if needed
Dubu executes tool
Dubu logs result
Dubu returns result to provider
```

This keeps behavior consistent across Claude, Codex, and API-based models.

The broker should handle:

- shell commands
- file reads/writes
- patch application
- git operations
- ClickUp or other MCP-style tools
- web lookups where enabled
- approval policy
- audit logging

## Routing Policy

Start with explicit provider switching. Add automatic routing after the provider interface and session persistence are stable.

Example config:

```yaml
routing:
  default: codex
  planning: claude
  coding: codex
  summarization: openai
  cheap: local
```

Expected commands:

```bash
dubu --provider claude "think through this"
dubu --provider codex "make the code change"
dubu config set routing.planning claude
dubu providers list
dubu providers test
```

## Portability

Dubu should install and run on:

- macOS
- Linux
- Windows PowerShell
- WSL

Cross-platform concerns:

- path handling
- shell differences
- config directory resolution
- process spawning
- environment variables
- quoting rules
- terminal behavior
- provider CLI discovery

Avoid hard dependencies on a single shell or OS. Prefer language-native path and process APIs over shell-specific behavior.

## Proposed Phases

### Phase 1: Stable CLI Shell

- Create a real `dubu` executable entry point.
- Resolve `DUBU_HOME` consistently.
- Load global config and project config.
- Add `dubu doctor`.
- Add `dubu providers list`.
- Preserve existing Claude-oriented mode as the default.

### Phase 2: Provider Interface

- Define Dubu's internal provider request/response shape.
- Implement Claude adapter.
- Implement Codex adapter.
- Add explicit `--provider` switching.
- Add provider capability reporting.

### Phase 3: Central Memory and Sessions

- Move durable memory/session concepts into Dubu-owned paths.
- Add session logging independent of provider.
- Add project-local `.dubu/` support.
- Add memory load summaries so the user can see what context was included.

### Phase 4: Skills and Tool Broker

- Normalize skill loading.
- Add provider-neutral skill metadata.
- Add a tool registry.
- Add approval and audit policy.
- Route tool requests through Dubu instead of provider-specific behavior where possible.

### Phase 5: Routing Policy

- Add task-type routing.
- Add config-driven provider preferences.
- Add fallback behavior when a provider is unavailable.
- Add optional cheap-model routing for summarization and indexing.

## Risks and Constraints

- CLI wrappers are brittle because upstream flags and output formats change.
- Provider APIs do not expose identical capabilities.
- Tool calling will need a Dubu-owned abstraction to avoid provider lock-in.
- Automatic routing can become confusing if it happens before explicit switching is solid.
- Cross-platform install is manageable, but quoting, path resolution, and process behavior need real testing.

## Near-Term Recommendation

Build the smallest useful version first:

1. A portable `dubu` command.
2. Shared config under `DUBU_HOME`.
3. Provider adapter interface.
4. Claude and Codex adapters.
5. Explicit provider switching.
6. Central session logs.
7. Skill loading that is independent of provider.

This keeps Dubu simple while creating the foundation for a real OpenClaw-style agent router without inheriting unnecessary framework weight.
