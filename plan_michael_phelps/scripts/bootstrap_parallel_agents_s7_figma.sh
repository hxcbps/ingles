#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
WORKTREE_BASE="$REPO_ROOT/.codex-worktrees/s7-figma"

LANES=(
  "S7-FG-01:codex/s7-fg-01"
  "S7-FG-02:codex/s7-fg-02"
  "S7-FG-03:codex/s7-fg-03"
  "S7-FG-04:codex/s7-fg-04"
  "S7-FG-05:codex/s7-fg-05"
  "S7-FG-06:codex/s7-fg-06"
  "S7-FG-07:codex/s7-fg-07"
  "S7-FG-08:codex/s7-fg-08"
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

echo "S7 Figma Wave-1 worktrees ready under: $WORKTREE_BASE"
