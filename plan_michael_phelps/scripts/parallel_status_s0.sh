#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
WORKTREE_BASE="$REPO_ROOT/.codex-worktrees/s0"

printf "%-12s %-24s %-10s %-8s\n" "STORY" "BRANCH" "AHEAD" "STATUS"
printf "%-12s %-24s %-10s %-8s\n" "-----" "------" "-----" "------"

for WT in "$WORKTREE_BASE"/*; do
  [ -d "$WT" ] || continue
  STORY="$(basename "$WT" | tr '[:lower:]' '[:upper:]')"
  BRANCH="$(git -C "$WT" branch --show-current)"
  AHEAD="$(git -C "$WT" rev-list --count "main..$BRANCH" 2>/dev/null || echo 0)"
  DIRTY="$(git -C "$WT" status --porcelain | wc -l | tr -d ' ')"
  STATUS="CLEAN"
  if [ "$DIRTY" != "0" ]; then
    STATUS="DIRTY"
  fi
  printf "%-12s %-24s %-10s %-8s\n" "$STORY" "$BRANCH" "$AHEAD" "$STATUS"
done
