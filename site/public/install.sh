#!/usr/bin/env bash
# cold.md installer
# Usage:
#   curl -fsSL https://cold.md/install | bash                       # install the Claude Code plugin
#   curl -fsSL https://cold.md/install | bash -s -- --scaffold      # also start ./cold.md + ./icp.md here
#   curl -fsSL https://cold.md/install | bash -s -- --skills-only   # copy skills + /cold into ~/.claude instead
#
# What it does:
#   1. With the `claude` CLI on PATH: adds the foxreach/cold-md marketplace and installs
#      the cold-md plugin (11 skills + the /cold command). Re-running updates it.
#   2. Without it, or with --skills-only: copies the skills to ~/.claude/skills/ and the
#      /cold command to ~/.claude/commands/.
#   3. --scaffold drops starter cold.md and icp.md files in the current directory.
#
# Safe to re-run. Source: https://github.com/foxreach/cold-md

set -euo pipefail

REPO="foxreach/cold-md"
REPO_TARBALL="https://github.com/${REPO}/archive/refs/heads/main.tar.gz"
SKILL_DIR="${HOME}/.claude/skills"
COMMAND_DIR="${HOME}/.claude/commands"
LEGACY_PLUGIN_DIR="${HOME}/.claude/plugins/cold-md"
SKILL_NAMES="cold-icp cold-offer cold-research cold-leads cold-draft cold-send cold-experiment cold-learn cold-triage cold-status cold-report"
TMPDIR="$(mktemp -d -t coldmd-setup.XXXXXX)"
trap 'rm -rf "$TMPDIR"' EXIT

MODE=plugin
SCAFFOLD=false
QUIET=false
EXTRACTED=""

for arg in "$@"; do
  case "$arg" in
    --skills-only|--without-foxreach|--no-foxreach) MODE=skills ;;
    --with-foxreach|--plugin) MODE=plugin ;;
    --scaffold) SCAFFOLD=true ;;
    --quiet) QUIET=true ;;
    --help|-h)
      printf '%s\n' \
        'curl -fsSL https://cold.md/install | bash                      install the Claude Code plugin' \
        'curl -fsSL https://cold.md/install | bash -s -- --scaffold     also start ./cold.md + ./icp.md' \
        'curl -fsSL https://cold.md/install | bash -s -- --skills-only  copy skills + /cold into ~/.claude'
      exit 0
      ;;
  esac
done

# Color setup. Honors NO_COLOR and non-tty output.
if [ -n "${NO_COLOR:-}" ] || [ ! -t 1 ]; then
  ORANGE=""; WHITE=""; DIM=""; GREEN=""; YELLOW=""; RED=""; BOLD=""; RESET=""
else
  ORANGE=$'\033[38;2;194;65;12m'
  WHITE=$'\033[38;2;250;247;242m'
  DIM=$'\033[38;5;244m'
  GREEN=$'\033[32m'
  YELLOW=$'\033[33m'
  RED=$'\033[31m'
  BOLD=$'\033[1m'
  RESET=$'\033[0m'
fi

log() { [ "$QUIET" = true ] || printf "  %s\n" "$*"; }
ok()  { [ "$QUIET" = true ] || printf "  ${GREEN}\xE2\x9C\x93${RESET} %s\n" "$*"; }
warn(){ printf "  ${YELLOW}!${RESET} %s\n" "$*" >&2; }
die() { printf "  ${RED}x${RESET} %s\n" "$*" >&2; exit 1; }

banner() {
  [ "$QUIET" = true ] && return
  printf '\n'
  printf '%s ██████  ██████  ██      ██████         ███    ███ ██████%s\n' "$ORANGE" "$RESET"
  printf '%s██      ██    ██ ██      ██   ██        ████  ████ ██   ██%s\n' "$ORANGE" "$RESET"
  printf '%s██      ██    ██ ██      ██   ██        ██ ████ ██ ██   ██%s\n' "$ORANGE" "$RESET"
  printf '%s██      ██    ██ ██      ██   ██  ██    ██  ██  ██ ██   ██%s\n' "$ORANGE" "$RESET"
  printf '%s ██████  ██████  ███████ ██████         ██      ██ ██████%s\n' "$ORANGE" "$RESET"
  printf '\n'
  printf '%sCold outreach that improves itself.%s\n' "$WHITE" "$RESET"
  printf '%shttps://cold.md%s\n\n' "$DIM" "$RESET"
}

fetch_repo() {
  [ -n "$EXTRACTED" ] && return 0
  log "Downloading ${REPO}..."
  curl -fsSL "$REPO_TARBALL" | tar -xz -C "$TMPDIR"
  EXTRACTED="$(find "$TMPDIR" -mindepth 1 -maxdepth 1 -type d -name 'cold-md-*' | head -1)"
  [ -n "$EXTRACTED" ] || die "failed to extract the repo"
  [ -d "$EXTRACTED/plugin/cold-md/skills" ] || die "tarball is missing plugin/cold-md/skills"
}

# Older installers copied skills to ~/.claude/skills and the plugin to
# ~/.claude/plugins/cold-md (which Claude Code never loaded). With the plugin
# installed, those skill copies would load twice, so move them aside.
retire_legacy_copies() {
  local backup="${HOME}/.claude/cold-md-backup-$(date +%Y%m%d%H%M%S)"
  local moved=0
  for name in $SKILL_NAMES; do
    if [ -d "$SKILL_DIR/$name" ]; then
      mkdir -p "$backup/skills"
      mv "$SKILL_DIR/$name" "$backup/skills/$name"
      moved=$((moved + 1))
    fi
  done
  if [ -f "$COMMAND_DIR/cold.md" ]; then
    mkdir -p "$backup/commands"
    mv "$COMMAND_DIR/cold.md" "$backup/commands/cold.md"
    moved=$((moved + 1))
  fi
  if [ -d "$LEGACY_PLUGIN_DIR" ]; then
    mkdir -p "$backup"
    mv "$LEGACY_PLUGIN_DIR" "$backup/plugin-cold-md"
    moved=$((moved + 1))
  fi
  if [ "$moved" -gt 0 ]; then
    ok "Moved $moved files from an older cold.md install to $backup"
  fi
}

install_plugin() {
  log "Installing the cold-md plugin with the claude CLI..."
  if claude plugin marketplace list 2>/dev/null | grep -q "cold-md"; then
    claude plugin marketplace update cold-md >/dev/null 2>&1 || warn "could not refresh the cold-md marketplace"
  else
    claude plugin marketplace add "$REPO" >/dev/null || return 1
  fi
  if claude plugin list 2>/dev/null | grep -q "cold-md@cold-md"; then
    claude plugin update cold-md@cold-md >/dev/null || return 1
    ok "cold-md plugin updated. Restart Claude Code to load the new version."
  else
    claude plugin install cold-md@cold-md >/dev/null || return 1
    ok "cold-md plugin installed: 11 skills and the /cold command"
  fi
}

install_skills() {
  fetch_repo
  mkdir -p "$SKILL_DIR" "$COMMAND_DIR"
  local installed=0
  for src in "$EXTRACTED/plugin/cold-md/skills/"*; do
    [ -d "$src" ] || continue
    local dest="$SKILL_DIR/$(basename "$src")"
    rm -rf "$dest"
    cp -R "$src" "$dest"
    installed=$((installed + 1))
  done
  cp "$EXTRACTED/plugin/cold-md/commands/cold.md" "$COMMAND_DIR/cold.md"
  ok "$installed skills copied to $SKILL_DIR/ and /cold to $COMMAND_DIR/"
}

check_foxreach() {
  if ! command -v foxreach >/dev/null 2>&1; then
    warn "foxreach CLI not found. The sending skills use it:  pip install foxreach-cli"
  fi
  if [ -z "${FOXREACH_API_KEY:-}" ]; then
    warn "FOXREACH_API_KEY not set. Create a key in FoxReach under Settings > Integrations > API Keys, then:"
    printf "      export FOXREACH_API_KEY=otr_...\n" >&2
  fi
}

maybe_scaffold() {
  if [ "$SCAFFOLD" != true ]; then
    [ -f "./cold.md" ] || log "No ./cold.md here. Run /cold init inside your repo, or re-run with --scaffold."
    return
  fi
  fetch_repo
  if [ ! -f "./cold.md" ]; then
    cp "$EXTRACTED/plugin/cold-md/skills/cold-draft/references/minimal.cold.md" "./cold.md"
    ok "Scaffolded ./cold.md from the minimal template"
  fi
  if [ ! -f "./icp.md" ]; then
    cat > ./icp.md <<'ICP'
---
coldMdVersion: "0"
source: scaffold
---

# ICP - [Your product]

Run `/cold icp https://your-site.com` (or `/cold icp` for Q&A) to fill this in.

## Company signals
## Title signals
## Pain signals (observable)
## Disqualifiers
## Qualification checklist
ICP
    ok "Scaffolded ./icp.md"
  fi
}

print_next_steps() {
  [ "$QUIET" = true ] && return
  printf '\n  %sNEXT%s (inside Claude Code, in your repo)\n' "$BOLD" "$RESET"
  printf '  1. %s/cold init%s                        set up .cold/ and check your FoxReach key\n' "$ORANGE" "$RESET"
  printf '  2. %s/cold icp https://your-site.com%s   build icp.md\n' "$ORANGE" "$RESET"
  printf '  3. %s/cold leads%s, %s/cold draft%s, %s/cold send%s\n' "$ORANGE" "$RESET" "$ORANGE" "$RESET" "$ORANGE" "$RESET"
  printf '  4. a week later: %s/cold learn%s       results propose a cold.md diff for your review\n' "$ORANGE" "$RESET"
  printf '\n  %sDocs:%s https://cold.md   %sSource:%s https://github.com/%s\n\n' "$DIM" "$RESET" "$DIM" "$RESET" "$REPO"
}

main() {
  banner
  command -v curl >/dev/null 2>&1 || die "missing required tool: curl"
  command -v tar  >/dev/null 2>&1 || die "missing required tool: tar"

  if [ "$MODE" = plugin ] && ! command -v claude >/dev/null 2>&1; then
    warn "claude CLI not found, copying skills into ~/.claude instead"
    MODE=skills
  fi

  if [ "$MODE" = plugin ]; then
    retire_legacy_copies
    if ! install_plugin; then
      warn "plugin install failed, copying skills into ~/.claude instead"
      MODE=skills
    fi
  fi
  [ "$MODE" = skills ] && install_skills

  check_foxreach
  maybe_scaffold
  print_next_steps
}

main "$@"
