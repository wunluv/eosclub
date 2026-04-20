---
description: How to create and use the EOS Club dev agent from this directory.
---

# EOS Club Dev Agent

## Purpose

Project-specific agent for eos-club.de site reliability. Handles build failures, deployment issues, content/schema mismatches, and production troubleshooting.

This agent is designed to be dispatched by Alph (the coordinator agent) when San reports issues with the EOS Club site. It can also be invoked directly for project-specific work.

## Structure

```
.letta/agent/eos-dev/
├── system/                          — Always in agent context (pinned to system prompt)
│   ├── persona.md                   — Identity, role, authority, constraints
│   ├── project-overview.md          — Stack, deployment, access patterns, key paths
│   ├── known-failure-patterns.md    — Diagnostic playbooks for recurring issues
│   └── diagnostic-commands.md       — Command cheat sheet
├── reference/
│   └── incident-log.md              — Chronological incident record
└── README.md                        — This file
```

The system/ files become the agent's system prompt memory — everything it needs to troubleshoot without discovery. The project's existing reference docs are accessible via `[[path]]` references:

- `plans/agent-quick-reference.md` — full architecture guide
- `deploy/KEYSTATIC_DEPLOYMENT_GUIDE.md` — deployment model
- `deploy/DEPLOYMENT_WORKLOG.md` — historical deployment issues
- `src/content/config.ts` — Zod schemas
- `keystatic.config.ts` — Keystatic CMS config

## Creating the Agent

```bash
# From the eosclub project root
cd ~/DEV/eosclub

# Create the agent using Letta CLI, pointing to this directory as memory source
letta create-agent \
  --name eos-dev \
  --description "EOS Club site reliability agent" \
  --memory-dir .letta/agent/eos-dev
```

The agent will load `system/*.md` into its context and have `reference/incident-log.md` available on demand.

## Dispatching from Alph

Alph uses the `dispatching-coding-agents` skill or `Task` tool to send work:

```
"EOS site is down. 404 on all pages. Probably Keystatic content broke the build. Investigate and fix."
```

The eos-dev agent already knows:
- How to SSH to the server
- Where the code lives
- The deployment pipeline
- Common failure patterns
- To build locally before pushing
- To verify with curl after deploying

## Maintaining This Agent

**After every incident:** Add entry to `reference/incident-log.md` and update `known-failure-patterns.md` if it's a new pattern.

**After architectural changes:** Update `project-overview.md` and `diagnostic-commands.md`.

**After schema/block changes:** Update `known-failure-patterns.md` with new sensitivity areas.

## Token Budget Estimate

~4,500 words across all system/ files ≈ **5,500-6,000 tokens** pinned to context. Lightweight enough to leave room for conversation and tool use within standard context windows.
