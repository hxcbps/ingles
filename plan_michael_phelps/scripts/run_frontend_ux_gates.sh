#!/usr/bin/env sh
set -eu

REPO_ROOT="${1:-/Users/dfernandez/code/ingles/plan_michael_phelps}"
STRICT_FRONTEND_TOKENS="${STRICT_FRONTEND_TOKENS:-0}"

fail() {
  echo "[FAIL] $1" >&2
  exit 1
}

run_step() {
  label="$1"
  shift
  echo "[RUN ] $label"
  "$@"
  echo "[ OK ] $label"
}

[ -d "$REPO_ROOT" ] || fail "Repo root not found: $REPO_ROOT"
[ -f "$REPO_ROOT/app/web/index.html" ] || fail "Frontend shell not found under $REPO_ROOT"
[ -f "$REPO_ROOT/app/web/js/routing/canonical_routes_s0.js" ] || fail "Missing canonical route contract"

cd "$REPO_ROOT"

run_step "Architecture docs lint" python3 scripts/lint_architecture_docs.py --repo-root .
run_step "Architecture docs drift" python3 scripts/check_docs_drift.py --repo-root .
run_step "English Sprint audit" python3 scripts/audit_english_sprint.py --repo-root .
run_step "Web runtime tests" node --test app/web/js/tests/*.test.mjs

echo "[RUN ] Shell CSS entrypoint policy"
entry_count=$(rg -n 'data-css-entrypoint="canonical"' app/web/index.html | wc -l | tr -d ' ')
[ "$entry_count" -eq 1 ] || fail "Expected exactly one canonical CSS entrypoint; found $entry_count"
echo "[ OK ] Shell CSS entrypoint policy"

echo "[RUN ] Accessibility CSS checks"
rg -n ':focus-visible' app/web/css >/dev/null || fail "Missing :focus-visible styles in app/web/css"
rg -n 'prefers-reduced-motion' app/web/css >/dev/null || fail "Missing prefers-reduced-motion handling in app/web/css"
echo "[ OK ] Accessibility CSS checks"

echo "[RUN ] UI boundary imports"
if rg -n 'from\s+["\x27][^"\x27]*(/content/|/state/|/routing/)' app/web/js/ui -g '*.js'; then
  fail "Forbidden UI imports found (content/state/routing)."
fi
echo "[ OK ] UI boundary imports"

echo "[RUN ] Route/view ID parity"
node <<'NODE'
const fs = require('fs');
const path = require('path');

const canonicalPath = path.join(process.cwd(), 'app/web/js/routing/canonical_routes_s0.js');
const viewsPath = path.join(process.cwd(), 'app/web/js/ui/views.js');

const canonicalText = fs.readFileSync(canonicalPath, 'utf8');
const viewsText = fs.readFileSync(viewsPath, 'utf8');

const toUniqueSorted = (items) => Array.from(new Set(items)).sort();

const canonicalBlock = canonicalText.match(/export\s+const\s+CANONICAL_ROUTES\s*=\s*Object\.freeze\(\{([\s\S]*?)\}\);/);
if (!canonicalBlock) {
  console.error('[FAIL] Could not parse CANONICAL_ROUTES block.');
  process.exit(1);
}

const canonicalIds = toUniqueSorted(
  Array.from(canonicalBlock[1].matchAll(/^\s*([a-zA-Z0-9_]+)\s*:\s*Object\.freeze\(\{/gm)).map((m) => m[1])
);

const viewMetaBlock = viewsText.match(/export\s+const\s+VIEW_META\s*=\s*Object\.freeze\(\{([\s\S]*?)\}\);/);
if (!viewMetaBlock) {
  console.error('[FAIL] Could not parse VIEW_META block.');
  process.exit(1);
}

const viewIds = toUniqueSorted(
  Array.from(viewMetaBlock[1].matchAll(/^\s*([a-zA-Z0-9_]+)\s*:\s*Object\.freeze\(\{/gm)).map((m) => m[1])
);

if (canonicalIds.length === 0 || viewIds.length === 0) {
  console.error('[FAIL] Could not parse route/view IDs.');
  process.exit(1);
}

const missingInViews = canonicalIds.filter((id) => !viewIds.includes(id));
const missingInCanonical = viewIds.filter((id) => !canonicalIds.includes(id));

if (missingInViews.length || missingInCanonical.length) {
  console.error('[FAIL] Route/view ID mismatch.');
  if (missingInViews.length) console.error('Missing in views:', missingInViews.join(', '));
  if (missingInCanonical.length) console.error('Missing in canonical routes:', missingInCanonical.join(', '));
  process.exit(1);
}

console.log('[ OK ] Route/view IDs aligned:', canonicalIds.join(', '));
NODE

echo "[RUN ] Token discipline advisory"
color_hits="$(rg -n '#[0-9a-fA-F]{3,8}\b|rgba?\(' app/web/css --glob '!tokens.css' --glob '!index.css' || true)"
if [ -n "$color_hits" ]; then
  count=$(printf '%s\n' "$color_hits" | sed '/^$/d' | wc -l | tr -d ' ')
  echo "[WARN] Found $count hard-coded color-like values outside tokens.css"
  printf '%s\n' "$color_hits" | head -n 20
  if [ "$STRICT_FRONTEND_TOKENS" = "1" ]; then
    fail "Strict token mode enabled and hard-coded color-like values were found."
  fi
else
  echo "[ OK ] No hard-coded color-like values outside tokens.css"
fi

echo "[PASS] Frontend UX gates completed successfully"
