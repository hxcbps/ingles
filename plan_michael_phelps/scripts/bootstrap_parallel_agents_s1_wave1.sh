#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
APP_DIR="$REPO_ROOT/plan_michael_phelps"
WORKTREE_BASE="$REPO_ROOT/.codex-worktrees/s1-wave1"

LANES=(
  "S1-W1-01:codex/s1-w1-01"
  "S1-W1-02:codex/s1-w1-02"
  "S1-W1-03:codex/s1-w1-03"
  "S1-W1-04:codex/s1-w1-04"
  "S1-W1-05:codex/s1-w1-05"
  "S1-W1-06:codex/s1-w1-06"
  "S1-W1-07:codex/s1-w1-07"
  "S1-W1-08:codex/s1-w1-08"
  "S1-W1-09:codex/s1-w1-09"
)

mkdir -p "$WORKTREE_BASE"

for lane_branch in "${LANES[@]}"; do
  LANE="${lane_branch%%:*}"
  BRANCH="${lane_branch##*:}"
  LANE_LOWER="$(echo "$LANE" | tr '[:upper:]' '[:lower:]')"
  WT_DIR="$WORKTREE_BASE/$LANE_LOWER"

  if [ ! -d "$WT_DIR" ]; then
    if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
      git worktree add "$WT_DIR" "$BRANCH"
    else
      git worktree add -b "$BRANCH" "$WT_DIR" "main"
    fi
  fi

  mkdir -p "$WT_DIR/plan_michael_phelps/.agent-workpack"

  cat > "$WT_DIR/plan_michael_phelps/.agent-workpack/START_HERE.md" <<RUNBOOK
# ${LANE} kickoff

1. cd "$WT_DIR/plan_michael_phelps"
2. Read queue ownership in:
   guides/backlog/agents/S1_AGENT_ASSIGNMENT_WAVE1.md
3. Apply only owned file scope.
4. Validate with audit script before opening PR.
5. PR title: [${LANE}] short summary
RUNBOOK

done

echo "S1 Wave-1 worktrees ready under: $WORKTREE_BASE"
