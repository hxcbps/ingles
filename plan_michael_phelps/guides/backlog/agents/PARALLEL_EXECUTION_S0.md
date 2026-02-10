# Sprint 0 Parallel Execution Plan

Goal: execute `S0-B01..S0-B09` in parallel with strict isolation and dependency-aware release flow.

## Execution Model

- 1 Codex agent per story.
- 1 branch/worktree per story.
- No cross-story file edits unless dependency is marked complete.
- Integration happens by dependency wave, not all-at-once.

## Agent to Story Mapping

| Agent | Story | Branch | Worktree Path |
|---|---|---|---|
| `Agent-S0-01` | `S0-B01` | `codex/s0-b01` | `.codex-worktrees/s0/s0-b01` |
| `Agent-S0-02` | `S0-B02` | `codex/s0-b02` | `.codex-worktrees/s0/s0-b02` |
| `Agent-S0-03` | `S0-B03` | `codex/s0-b03` | `.codex-worktrees/s0/s0-b03` |
| `Agent-S0-04` | `S0-B04` | `codex/s0-b04` | `.codex-worktrees/s0/s0-b04` |
| `Agent-S0-05` | `S0-B05` | `codex/s0-b05` | `.codex-worktrees/s0/s0-b05` |
| `Agent-S0-06` | `S0-B06` | `codex/s0-b06` | `.codex-worktrees/s0/s0-b06` |
| `Agent-S0-07` | `S0-B07` | `codex/s0-b07` | `.codex-worktrees/s0/s0-b07` |
| `Agent-S0-08` | `S0-B08` | `codex/s0-b08` | `.codex-worktrees/s0/s0-b08` |
| `Agent-S0-09` | `S0-B09` | `codex/s0-b09` | `.codex-worktrees/s0/s0-b09` |

## Dependency Waves

1. Wave A (start now): `S0-B01`, `S0-B06`
2. Wave B (after `S0-B01`): `S0-B02`, `S0-B03`, `S0-B09`
3. Wave C (after `S0-B03`): `S0-B04`
4. Wave D (after `S0-B04`): `S0-B05`, `S0-B08`
5. Wave E (after `S0-B06`): `S0-B07`

## Conflict Avoidance Rules

1. Agent edits only story-owned paths listed in its workpack.
2. Shared files (`routes.js`, `learning_shell.js`, workflow files) require lock in daily sync.
3. Rebase before PR submission.
4. PR title format: `[S0-BXX][Agent-S0-YY] short summary`.

## Bring-up Commands

```bash
cd /Users/dfernandez/code/ingles/plan_michael_phelps
bash scripts/bootstrap_parallel_agents_s0.sh
bash scripts/parallel_status_s0.sh
```

## Daily Sync Output Contract

Each agent must post:
- `story_id`
- `status` (`STARTED|BLOCKED|IN_REVIEW|DONE`)
- `changed_files`
- `validation_evidence`
- `blocker` (if any)

