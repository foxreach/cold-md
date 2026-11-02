# Architecture - cold.md

## The three layers

```
┌─────────────────────────────────────────┐
│  Spec (spec/cold-md-v0.md)              │  ← the product
│  - Eight sections, ordered              │
│  - Defines what a conforming agent does │
└─────────────────────────────────────────┘
              ▲  reads
              │
┌─────────────────────────────────────────┐
│  Plugin (plugin/cold-md/, 11 skills)    │  ← reference implementation
│  - /cold router + skills per step       │
│  - Enforces banned list, voice, proof   │
│  - Sends + learns through FoxReach CLI  │
└─────────────────────────────────────────┘
              ▲  consumes
              │
┌─────────────────────────────────────────┐
│  User's cold.md (in their repo)         │  ← the config
│  - Identity, Audience, Value, Voice...  │
│  - Portable, versioned, diffable        │
└─────────────────────────────────────────┘
```

## Data flow

1. User writes `cold.md` in their repo (or copies from `examples/minimal.cold.md`).
2. User runs `/cold init`, which writes `.cold/config.json`.
3. Each `/cold <step>` dispatches to one skill. Skills read cold.md / icp.md and write their outputs to the repo or `.cold/`.
4. Sending skills (leads, send, learn, triage, report) call the `foxreach` CLI; the rest are local.
5. `cold-learn` turns per-variant reply stats into a proposed cold.md diff; the user approves it (trust ladder).

## Distribution

- **Spec** - hosted at cold.md (the domain) + GitHub.
- **Plugin** - marketplace in this repo (`/plugin marketplace add foxreach/cold-md`), installed by `cold.md/install`. See decisions/2026-11-03-plugin-is-the-distribution.md.
- **Commercial** - FoxReach is the reference SaaS implementation; runs cold.md at scale.

## Upstream/downstream

- **Upstream of the spec:** nothing. The spec is the root of truth.
- **Downstream:**
  - The Claude Code plugin (this repo).
  - FoxReach's prompt layer (separate repo).
  - Future: open-source Python/TS parsers, third-party tools.
