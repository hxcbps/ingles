#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
BASE="$REPO_ROOT/.codex-worktrees/s0"

wave_for() {
  case "$1" in
    S0-B01|S0-B06) echo "A" ;;
    S0-B02|S0-B03|S0-B09) echo "B" ;;
    S0-B04) echo "C" ;;
    S0-B05|S0-B08) echo "D" ;;
    S0-B07) echo "E" ;;
    *) echo "-" ;;
  esac
}

dep_for() {
  case "$1" in
    S0-B01|S0-B06) echo "-" ;;
    S0-B02|S0-B03|S0-B09) echo "S0-B01" ;;
    S0-B04) echo "S0-B03" ;;
    S0-B05|S0-B08) echo "S0-B04" ;;
    S0-B07) echo "S0-B06" ;;
    *) echo "-" ;;
  esac
}

printf "%-7s %-6s %-24s %-8s %-8s %-12s\n" "Story" "Wave" "Branch" "Ahead" "Dirty" "DependsOn"
printf "%-7s %-6s %-24s %-8s %-8s %-12s\n" "-----" "----" "------" "-----" "-----" "---------"

for STORY in S0-B01 S0-B06 S0-B02 S0-B03 S0-B09 S0-B04 S0-B05 S0-B08 S0-B07; do
  slug="$(echo "$STORY" | tr '[:upper:]' '[:lower:]')"
  wt="$BASE/$slug"
  branch="codex/$slug"
  ahead="0"
  dirty="N/A"

  if [ -d "$wt" ]; then
    ahead="$(git -C "$wt" rev-list --count "main..$branch" 2>/dev/null || echo 0)"
    dirty_count="$(git -C "$wt" status --porcelain | wc -l | tr -d ' ')"
    if [ "$dirty_count" = "0" ]; then
      dirty="NO"
    else
      dirty="YES"
    fi
  fi

  printf "%-7s %-6s %-24s %-8s %-8s %-12s\n" "$STORY" "$(wave_for "$STORY")" "$branch" "$ahead" "$dirty" "$(dep_for "$STORY")"
done
