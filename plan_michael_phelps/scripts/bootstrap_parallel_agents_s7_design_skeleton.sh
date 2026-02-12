#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
WORKTREE_BASE="$REPO_ROOT/.codex-worktrees/s7-design-skeleton"

LANES=(
  "S7-DS-01:codex/s7-ds-01"
  "S7-DS-02:codex/s7-ds-02"
  "S7-DS-03:codex/s7-ds-03"
  "S7-DS-04:codex/s7-ds-04"
  "S7-DS-05:codex/s7-ds-05"
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

echo "S7 Design Skeleton Wave-2 worktrees ready under: $WORKTREE_BASE"
