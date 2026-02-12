#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
WORKTREE_BASE="$REPO_ROOT/.codex-worktrees/s6-uiux"

LANES=(
  "S6-UX-01:codex/s6-ux-01"
  "S6-UX-02:codex/s6-ux-02"
  "S6-UX-03:codex/s6-ux-03"
  "S6-UX-04:codex/s6-ux-04"
  "S6-UX-05:codex/s6-ux-05"
  "S6-UX-06:codex/s6-ux-06"
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

echo "S6 UIUX Wave-1 worktrees ready under: $WORKTREE_BASE"
