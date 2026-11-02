# 2026-11-03 - The plugin marketplace is the distribution

**Decision:** cold.md ships as a Claude Code plugin from a marketplace in this repo
(`foxreach/cold-md`, plugin `cold-md@cold-md`). `plugin/cold-md/skills/` is the single source of
each skill. Copying skills into `~/.claude/skills` is a fallback, not the default.

**Why:** the April installer put the skills in two places (so they loaded twice) and the plugin in
a folder Claude Code never reads, and the manifest did not validate. Plugins installed from a
marketplace update with `claude plugin update`, which a curl installer cannot do cleanly.

**Consequence:** a change to a skill is a change to one file. `scripts/check.sh` keeps the
cold-draft reference copies of the spec and examples in sync with the originals.
