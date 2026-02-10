#!/usr/bin/env bash
set -euo pipefail

ROOT_REPO="$(git rev-parse --show-toplevel)"
MAIN_APP="$ROOT_REPO/plan_michael_phelps"
WT_BASE="$ROOT_REPO/.codex-worktrees/s0"

if [ ! -d "$WT_BASE" ]; then
  echo "No worktrees found at $WT_BASE"
  exit 1
fi

copy_if_exists() {
  local src="$1"
  local dst="$2"
  if [ -e "$src" ]; then
    mkdir -p "$(dirname "$dst")"
    if [ -d "$src" ]; then
      rsync -a "$src/" "$dst/"
    else
      cp "$src" "$dst"
    fi
  fi
}

for WT in "$WT_BASE"/*; do
  [ -d "$WT" ] || continue
  APP="$WT/plan_michael_phelps"

  copy_if_exists "$MAIN_APP/docs" "$APP/docs"
  copy_if_exists "$MAIN_APP/.github" "$APP/.github"
  copy_if_exists "$MAIN_APP/scripts" "$APP/scripts"
  copy_if_exists "$MAIN_APP/guides/backlog" "$APP/guides/backlog"
  copy_if_exists "$MAIN_APP/guides/contracts" "$APP/guides/contracts"

  copy_if_exists "$MAIN_APP/learning/content/schema.v4.1.json" "$APP/learning/content/schema.v4.1.json"
  copy_if_exists "$MAIN_APP/app/web/js/core/events_schema_v1.js" "$APP/app/web/js/core/events_schema_v1.js"
  copy_if_exists "$MAIN_APP/app/web/js/routing/canonical_routes_s0.js" "$APP/app/web/js/routing/canonical_routes_s0.js"
  copy_if_exists "$MAIN_APP/app/web/index.html" "$APP/app/web/index.html"

  # keep per-worktree .agent-workpack untouched except ensuring it exists
  mkdir -p "$APP/.agent-workpack"
done

echo "Kickoff artifacts synced to worktrees under $WT_BASE"
