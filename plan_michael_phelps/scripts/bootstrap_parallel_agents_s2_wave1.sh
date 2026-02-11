#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
WORKTREE_BASE="$REPO_ROOT/.codex-worktrees/s2-wave1"

LANES=(
  "S2-W1-01:codex/s2-w1-01"
  "S2-W1-02:codex/s2-w1-02"
  "S2-W1-03:codex/s2-w1-03"
  "S2-W1-04:codex/s2-w1-04"
  "S2-W1-05:codex/s2-w1-05"
  "S2-W1-06:codex/s2-w1-06"
  "S2-W1-07:codex/s2-w1-07"
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

done

echo "S2 Wave-1 worktrees ready under: $WORKTREE_BASE"
