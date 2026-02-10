#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
APP_DIR="$REPO_ROOT/plan_michael_phelps"
WORKTREE_BASE="$REPO_ROOT/.codex-worktrees/s0"

STORIES=(
  "S0-B01"
  "S0-B02"
  "S0-B03"
  "S0-B04"
  "S0-B05"
  "S0-B06"
  "S0-B07"
  "S0-B08"
  "S0-B09"
)

mkdir -p "$WORKTREE_BASE"

for STORY in "${STORIES[@]}"; do
  STORY_LOWER="$(echo "$STORY" | tr '[:upper:]' '[:lower:]')"
  BRANCH="codex/${STORY_LOWER}"
  WT_DIR="$WORKTREE_BASE/$STORY_LOWER"

  if [ ! -d "$WT_DIR" ]; then
    if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
      git worktree add "$WT_DIR" "$BRANCH"
    else
      git worktree add -b "$BRANCH" "$WT_DIR" "main"
    fi
  fi

  mkdir -p "$WT_DIR/plan_michael_phelps/.agent-workpack"

  SOURCE_WP="$APP_DIR/guides/backlog/agents/workpacks/$STORY.md"
  TARGET_WP="$WT_DIR/plan_michael_phelps/.agent-workpack/$STORY.md"

  if [ -f "$SOURCE_WP" ]; then
    cp "$SOURCE_WP" "$TARGET_WP"
  fi

  cat > "$WT_DIR/plan_michael_phelps/.agent-workpack/START_HERE.md" <<RUNBOOK
# ${STORY} kickoff

1. cd "$WT_DIR/plan_michael_phelps"
2. Read: .agent-workpack/${STORY}.md
3. Execute scoped work for ${STORY}
4. Validate using commands in the story definition
5. Open PR from branch ${BRANCH}
RUNBOOK

done

echo "Parallel worktrees ready under: $WORKTREE_BASE"
