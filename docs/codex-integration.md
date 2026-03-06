# Codex Integration Guide

This repository now supports both Claude and Codex automation workflows.

## What Was Added

- Codex implementation workflow: `.github/workflows/codex.yml`
- Codex review workflow: `.github/workflows/codex-code-review.yml`
- Codex prompt assets:
  - `.github/prompts/codex-implement.md`
  - `.github/prompts/codex-review.md`
- Agent playbook: `AGENTS.md`
- Repo-local Codex skill: `.agents/skills/gridspace-delivery`
- Local bootstrap script: `scripts/setup-codex.sh`

## Required GitHub Secrets

1. `OPENAI_API_KEY`
   - API key used by `openai/codex-action`.
2. `PROJECT_TOKEN` (optional but recommended)
   - Personal/project token with Projects permission for Kanban updates.
   - If absent, coding still runs; Kanban moves are skipped.

Existing Claude secrets remain unchanged:

- `CLAUDE_CODE_OAUTH_TOKEN`
- `PROJECT_TOKEN` (shared with Kanban workflow)

## How To Trigger Claude vs Codex

Claude (already configured):

- Mention `@claude` in:
  - issue body/title
  - issue comment
  - PR review comment/review body
- Or apply `claude-code` label.

Codex (new):

- Mention `@codex` in:
  - issue body/title
  - issue comment
  - PR review comment/review body
- Mention `@codex review` (or `/codex review`) on a PR for on-demand review.
- Or apply `codex` / `codex-code` label.

## Current Workflow Behavior

### `codex.yml`

- Routes implementation tasks from issue/PR mentions.
- Adds labels `codex-code` and `ai-agent`.
- Posts issue pickup acknowledgment.
- Moves issue to Kanban `In progress` and `In review` when `PROJECT_TOKEN` is available.
- Runs `openai/codex-action@v1` using repo prompts and workspace-write sandbox.

### `codex-code-review.yml`

- Runs on PR open/sync/reopen/ready events.
- Supports manual review trigger through `@codex review`.
- Caps automated bot review loops at 3 iterations.
- Auto-approves on max iterations to avoid deadlock (matches existing Claude pattern).

## Skills and MCP (Codex Runtime)

Configured in local Codex runtime:

- MCP servers:
  - `filesystem` (`@anthropic-ai/mcp-server-filesystem`)
  - `playwright` (`@anthropic-ai/mcp-server-playwright`)
  - `context7` (`@anthropic-ai/mcp-server-context7`)
- Installed official Codex skills:
  - `gh-fix-ci`
  - `gh-address-comments`
  - `playwright`
  - `security-best-practices`
  - `security-threat-model`
- Added repo-local skill:
  - `.agents/skills/gridspace-delivery` (GridSpace architecture + validation workflow)

To bootstrap the same setup on another machine:

`bash scripts/setup-codex.sh`

If sandbox policy blocks writes to `~/.codex`, the script auto-falls back to repo-local `CODEX_HOME` at `.codex-home`.

## Recommended Repository Settings

1. In branch protection for `main`, require:
   - `GridSpace CI`
   - `Codex Code Review` (and/or `Claude Code Review`)
2. Keep workflow permissions at least:
   - `contents: write`
   - `pull-requests: write`
   - `issues: write`
3. Keep `GITHUB_TOKEN` default permission at read/write for pull requests if you want bot PR creation and review posting.

## Quick Smoke Test

1. Open an issue titled: `@codex test workflow wiring`.
2. Confirm `Codex` workflow starts and posts acknowledgment.
3. Add PR comment `@codex review` on any open PR.
4. Confirm `Codex Code Review` workflow starts.
