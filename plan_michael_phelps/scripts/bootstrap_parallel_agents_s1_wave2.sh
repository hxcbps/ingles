#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
WORKTREE_BASE="$REPO_ROOT/.codex-worktrees/s1-wave2"

LANES=(
  "S1-W2-01:codex/s1-w2-01"
  "S1-W2-02:codex/s1-w2-02"
  "S1-W2-03:codex/s1-w2-03"
  "S1-W2-04:codex/s1-w2-04"
  "S1-W2-05:codex/s1-w2-05"
  "S1-W2-06:codex/s1-w2-06"
  "S1-W2-07:codex/s1-w2-07"
  "S1-W2-08:codex/s1-w2-08"
  "S1-W2-09:codex/s1-w2-09"
  "S1-W2-10:codex/s1-w2-10"
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

echo "S1 Wave-2 worktrees ready under: $WORKTREE_BASE"
