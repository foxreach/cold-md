# cold.md - CLAUDE.md

## What is this
An opinionated, executable spec for AI-driven cold outreach. A `cold.md` file defines a sender's identity, audience, voice, proof, sequences, and banned phrases. Any conforming agent (Claude Code skill, FoxReach, custom tooling) reads it and produces outreach that matches.

Domain: [cold.md](https://cold.md)
Repo: github.com/foxreach/cold-md (moved from concaption/cold-md on 2026-11-03; old URLs redirect)
Commercial home: [foxreach.io](https://www.foxreach.io) (reference implementation - runs your cold.md at scale)

## Layout

```
spec/                    The canonical spec. Versioned. spec/cold-md-v0.md is current.
plugin/cold-md/          The Claude Code plugin. skills/<name>/SKILL.md is the ONLY copy of each skill.
  commands/cold.md       The /cold router, including the inline /cold init wizard.
.claude-plugin/          marketplace.json (source ./plugin/cold-md) for `/plugin marketplace add foxreach/cold-md`.
examples/                Real cold.md files. foxreach.cold.md is live. Copied into cold-draft/references/.
site/                    Next.js site at cold.md. site/public/install.sh is served at cold.md/install.
scripts/check.sh         Pre-commit checks. Run it before every commit.
memory/                  Architecture decisions, discovery, changelog (don't commit private stuff).
```

## Rules for working in this repo

- **The spec is the product.** Every change to `spec/` is a commercial decision. Discuss in `memory/decisions/` before editing.
- **Small before complete.** The spec must fit on one screen. If a section grows past ~15 lines, split or cut.
- **Executable over descriptive.** Every spec rule must answer "what does a conforming agent do differently?" If it doesn't, delete it.
- **Vendor-neutral in the spec.** FoxReach lives in README + site, not inside the spec.
- **Public from day one.** Assume the world reads every commit. No pricing, no client names inside cold.md files unless the client approved.

## Pre-commit checks
Run `scripts/check.sh`. It validates both manifests, checks that the reference copies in
`cold-draft/references/` match `spec/` and `examples/`, keeps the spec under 220 lines, checks
skill frontmatter, greps for dead FoxReach URLs and retired CLI commands, and syntax-checks the
installer. Also build the site (`cd site && npx next build`) when it changed.

## Skills that call FoxReach
- Use only commands that exist in the published `foxreach-cli` (`foxreach <group> --help`) and
  the public API (`https://api.foxreach.io/openapi-public.json`, header `X-API-Key`, keys `otr_...`).
  On 2026-11-03 several skills were calling commands that never shipped; check before writing.
- Docs live at https://www.foxreach.io/docs/... (docs.foxreach.io is gone).
- The public API reads A/B variants but cannot create them. Skills hand the user the variant copy
  and the app steps; never claim a variant was created.

## Memory system
- `memory/architecture/` - how pieces fit together
- `memory/decisions/` - why we chose X over Y (append-only, dated)
- `memory/discovery/` - findings not yet acted on
- `memory/changelog/` - per-session summary of what changed

Before any non-trivial change, grep `memory/decisions/` for prior constraints.
