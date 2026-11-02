#!/usr/bin/env bash
# Pre-commit checks for cold-md. Run from the repo root: scripts/check.sh
set -uo pipefail
cd "$(dirname "$0")/.."
fail=0
bad() { printf 'FAIL %s\n' "$*"; fail=1; }
okk() { printf 'ok   %s\n' "$*"; }

# 1. Manifests validate (needs the claude CLI; skipped without it)
if command -v claude >/dev/null 2>&1; then
  claude plugin validate plugin/cold-md >/dev/null 2>&1 && okk "plugin manifest" || bad "claude plugin validate plugin/cold-md"
  claude plugin validate .claude-plugin/marketplace.json >/dev/null 2>&1 && okk "marketplace manifest" || bad "claude plugin validate .claude-plugin/marketplace.json"
else
  echo "skip manifest validation (no claude CLI)"
fi

# 2. cold-draft ships copies of the spec and examples; they must match the originals
REF=plugin/cold-md/skills/cold-draft/references
for pair in "spec/cold-md-v0.md:$REF/spec-v0.md" "examples/minimal.cold.md:$REF/minimal.cold.md" "examples/foxreach.cold.md:$REF/foxreach.cold.md"; do
  src=${pair%%:*}; dst=${pair##*:}
  cmp -s "$src" "$dst" && okk "$dst in sync" || bad "$dst differs from $src (cp $src $dst)"
done

# 3. Spec stays small
lines=$(wc -l < spec/cold-md-v0.md)
[ "$lines" -le 220 ] && okk "spec is $lines lines" || bad "spec is $lines lines (limit 220)"

# 4. Every skill folder has a SKILL.md with name + description
for d in plugin/cold-md/skills/*/; do
  f="$d/SKILL.md"; n=$(basename "$d")
  [ -f "$f" ] || { bad "$n has no SKILL.md"; continue; }
  grep -q "^name: $n\$" "$f" && grep -q '^description: ' "$f" || bad "$n frontmatter needs name: $n and description:"
done
okk "$(ls -d plugin/cold-md/skills/*/ | wc -l | tr -d ' ') skills checked"

# 5. Dead or retired references
pattern='docs\.foxreach\.io|foxreach\.io/audit|foxreach\.io/how-it-works|concaption/cold-md|foxreach variants|sequences add|inbox bulk-update|leads create-batch|workspace-stats|account-stats|FOXREACH_API_KEY=fr_'
hits=$(grep -rnE "$pattern" README.md plugin spec examples site/app site/public 2>/dev/null | grep -v 'spec/2026-04-28' || true)
[ -z "$hits" ] && okk "no dead links or retired commands" || { bad "dead links or retired commands:"; echo "$hits"; }

# 6. Installer parses
bash -n site/public/install.sh && okk "install.sh syntax" || bad "install.sh syntax"

exit $fail
