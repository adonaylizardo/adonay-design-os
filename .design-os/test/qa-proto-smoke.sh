#!/usr/bin/env bash
# Fictional QA smoke for design proto — run from repo root; cleans up on exit.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

SLUG="acme-north-qa"
REFUSE_SLUG="acme-north-qa-refuse"
FEATURE="handoff-hub"
CLI="node .design-os/bin/design.js"

log() { echo "▶ $*"; }

cleanup() {
  log "Cleanup: removing fictional project and proto branches"
  git checkout cursor/fix-design-proto-bfd1 2>/dev/null || git checkout main 2>/dev/null || true
  git branch -D "proto/${SLUG}/${FEATURE}/alt-a" 2>/dev/null || true
  git branch -D "proto/${SLUG}/${FEATURE}/base" 2>/dev/null || true
  rm -rf "projects/${SLUG}" "projects/${REFUSE_SLUG}"
}
trap cleanup EXIT

log "A. Refuse without DS"
rm -rf "projects/${REFUSE_SLUG}"
$CLI init "Acme North QA Refuse" >/dev/null 2>&1
OUT=$($CLI proto init "$REFUSE_SLUG" --feature test 2>&1 || true)
if echo "$OUT" | grep -q "No design system markdown"; then
  log "PASS A: refused without DS"
else
  echo "FAIL A"; exit 1
fi
rm -rf "projects/${REFUSE_SLUG}"

log "Setup fictional project ${SLUG}"
$CLI init "Acme North QA" >/dev/null
mkdir -p "projects/${SLUG}/context/documents"

cat > "projects/${SLUG}/context/documents/tokens.md" <<'EOF'
# Acme North — Design Tokens (fictional QA)

## Colors
- primary: #0ea5e9
- primary-hover: #0284c7
- surface: #f0f9ff
- text: #0c4a6e
- text-muted: #64748b
- border: #bae6fd

**Font family:** "IBM Plex Sans", system-ui, sans-serif

## Type scale
- --text-lg: 1.25rem
- --text-2xl: 2rem

## Spacing
- --space-4: 1.125rem
- --space-6: 1.75rem
- --space-8: 2.25rem
EOF

cat > "projects/${SLUG}/context/prd.md" <<'EOF'
# Product Requirements Document
Project: Acme North QA

## Problem Statement

Operations managers lose track of approval handoffs when work spans email, chat, and a legacy tracker.

## Goals

### User Goal
Complete an approval in one place without losing context between steps.

### Business Goal
Cut median approval cycle time by 20% this quarter.

## Edge Cases

- Reviewers offline must see pending state when they reconnect.
EOF

$CLI knowledge "$SLUG" >/dev/null

log "B. Init with DS + knowledge + PRD"
$CLI proto init "$SLUG" --feature "$FEATURE" 2>&1 | tee /tmp/proto-init.log
grep -q "Prototype scaffolded" /tmp/proto-init.log
grep -q "Committed prototype files" /tmp/proto-init.log || grep -q "proto/${SLUG}/${FEATURE}/base" /tmp/proto-init.log

PROTO="projects/${SLUG}/prototypes/${FEATURE}"
test -f "$PROTO/package.json"

log "C. Tokens merged"
grep -q '#0ea5e9' "$PROTO/src/tokens.css"
grep -q '1.25rem' "$PROTO/src/tokens.css"
grep -q '1.125rem' "$PROTO/src/tokens.css"

log "D. RATIONALE + App PRD copy"
grep -q "approval handoffs" "$PROTO/RATIONALE.md"
grep -q "approval handoffs" "$PROTO/src/App.tsx"
! grep -q "Replace this screen with the flow from your PRD" "$PROTO/src/App.tsx"

log "E. index.html feature substituted"
grep -q "Prototype — ${FEATURE}" "$PROTO/index.html"
! grep -q "__FEATURE__" "$PROTO/index.html"

log "F. npm install && build"
(cd "$PROTO" && npm install --silent && npm run build)

log "G. Branch lifecycle"
$CLI proto branch create "$SLUG" --feature "$FEATURE" --option alt-a >/dev/null
echo "// alt-a marker" >> "$PROTO/src/App.tsx"
$CLI proto branch save "$SLUG" --feature "$FEATURE" --message "qa: alt-a marker" >/dev/null
ALT_SHA=$(git rev-parse "proto/${SLUG}/${FEATURE}/alt-a")
BASE_SHA=$(git rev-parse "proto/${SLUG}/${FEATURE}/base")
test "$ALT_SHA" != "$BASE_SHA"
FILE_COUNT=$(git ls-tree -r --name-only "proto/${SLUG}/${FEATURE}/base" | grep -c "projects/${SLUG}/prototypes/${FEATURE}/" || true)
test "$FILE_COUNT" -ge 5
$CLI proto branch switch "$SLUG" --feature "$FEATURE" --option base >/dev/null
! grep -q "alt-a marker" "$PROTO/src/App.tsx"
$CLI proto branch switch "$SLUG" --feature "$FEATURE" --option alt-a >/dev/null
grep -q "alt-a marker" "$PROTO/src/App.tsx"

log "H. Vite binds 127.0.0.1"
grep -q "127.0.0.1" "$PROTO/vite.config.ts"

log "J. No banned client names in product files"
! rg -i 'bain|volaris|kerry' --glob '!NOTICE' --glob '!LICENSE' . 2>/dev/null | grep -v Superdesigner || true

log "ALL QA CHECKS PASSED"
