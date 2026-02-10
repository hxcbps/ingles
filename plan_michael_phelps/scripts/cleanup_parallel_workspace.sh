#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
WORKTREE_PREFIX="${WORKTREE_PREFIX:-$REPO_ROOT/.codex-worktrees}"
RUNS_DIR="${RUNS_DIR:-$REPO_ROOT/plan_michael_phelps/guides/backlog/agents/runs}"
PRUNE_RUNS="${PRUNE_RUNS:-1}"

echo "[cleanup] repository: $REPO_ROOT"
echo "[cleanup] worktree prefix: $WORKTREE_PREFIX"

git worktree list --porcelain \
  | awk '/^worktree / {print $2}' \
  | while IFS= read -r wt; do
      if [[ "$wt" == "$WORKTREE_PREFIX"* ]]; then
        echo "[cleanup] removing worktree $wt"
        git worktree remove --force "$wt"
      fi
    done

if [[ "$PRUNE_RUNS" == "1" ]]; then
  if [[ -d "$RUNS_DIR" ]]; then
    echo "[cleanup] pruning run artifacts at $RUNS_DIR"
    rm -rf "$RUNS_DIR"
  else
    echo "[cleanup] run artifacts directory not found, skipping"
  fi
else
  echo "[cleanup] PRUNE_RUNS=0 -> keeping run artifacts"
fi

echo "[cleanup] done"
