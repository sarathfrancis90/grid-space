# Issue Orchestrator

Run the context-aware issue orchestrator to plan and dispatch parity issues to Claude.

## Modes

1. **Plan (default)**: `node scripts/orchestrate.mjs` — show execution plan
2. **Dispatch**: `node scripts/orchestrate.mjs --dispatch` — label issues for Claude GitHub Action
3. **Dispatch wave**: `node scripts/orchestrate.mjs --dispatch --wave 1` — dispatch specific wave
4. **Local**: `node scripts/orchestrate.mjs --local` — show Claude Code CLI commands

## Steps

1. Run `node scripts/orchestrate.mjs` to see the plan
2. Review the wave plan and context files in `.codex-output/`
3. When ready, run with `--dispatch` to trigger Claude on GitHub
4. Monitor PRs with `gh pr list --state open`
5. After wave N merges, dispatch wave N+1 with `--wave N+1`
