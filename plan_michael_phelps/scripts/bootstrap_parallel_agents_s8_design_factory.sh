#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
WORKTREE_BASE="$REPO_ROOT/.codex-worktrees/s8-design-factory"

LANES=(
  "S8-DF-01:codex/s8-df-01"
  "S8-DF-02:codex/s8-df-02"
  "S8-DF-03:codex/s8-df-03"
  "S8-DF-04:codex/s8-df-04"
  "S8-DF-05:codex/s8-df-05"
  "S8-DF-06:codex/s8-df-06"
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

echo "S8 Design Factory worktrees ready under: $WORKTREE_BASE"
