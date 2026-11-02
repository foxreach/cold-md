---
name: cold-status
description: Print a one-screen dashboard of the cold.md loop - policy files, beliefs learned, the active experiment, pending diffs and the single next action - from the local .cold/ folder, plus an optional live line (active campaigns, unread replies) when a FoxReach key is set. Use to orient before any other /cold step, after a break, or when the user asks "where are we" or runs `/cold status`.
---

# cold-status

The loop dashboard. Local and read-only; one optional, fast FoxReach check.

## When to use

- User says "what's the state", "where are we", "/cold status"
- Before running another `/cold <step>`, to confirm prerequisites
- After a long break, to see what is in flight

## Inputs (all optional)

- `.cold/config.json` (`version`, `experiments`, `guards`, `trust`)
- `.cold/beliefs.md`, `.cold/decisions.md`
- `.cold/experiments/.active`, `.cold/experiments/<id>/protocol.md`, `.cold/experiments/<id>/decision.md`
- `.cold/proposed-diff.patch`
- `.cold/trust.json`
- `.cold/last-import.json`, `.cold/last-send.json`, `.cold/last-report.json`
- `cold.md`, `icp.md`, `offer.md` (existence and last edit)
- `FOXREACH_API_KEY` (only for the live line)

## Process

### Step 1 - Check init state

If `.cold/config.json` does not exist, print `cold.md not initialized. Run /cold init first.` and stop.

If `config.version` is below `"0.3"` (or missing the `leads`/`sending` keys), add one line at the end: `Config is v0.2; defaults are used for leads/sending. Run /cold init --upgrade to write them.`

### Step 2 - Gather local state

Read every input that exists; skip missing ones silently. Do not write any file.

### Step 3 - Optional live line

Only when `FOXREACH_API_KEY` is set. Two calls, run together with a 10 second limit (the Bash tool timeout, or `timeout 10` where GNU coreutils is installed); if either fails or runs over, print `Live: unavailable (<command> failed)` and carry on.

```bash
foxreach campaigns list --status active --limit 100 --json | jq '.data | length'
foxreach inbox stats --json | jq '{unread, uncategorized}'
```

The CLI prints snake_case keys; `inbox stats` gives `unread` and `uncategorized` (curl: `GET https://api.foxreach.io/api/v1/inbox/stats` and `GET https://api.foxreach.io/api/v1/campaigns?status=active` with `-H "X-API-Key: $FOXREACH_API_KEY"`, keys under `.data`). If `meta.total` is present on the campaigns call, use it for the count. Skip this step entirely with `--offline`.

For full numbers, point to `/cold report`.

### Step 4 - Print the dashboard

Keep it under ~80 columns. Plain ASCII; `OK`, `WARN`, `MISSING` instead of symbols.

```
cold.md status - 2026-11-03 09:14

POLICY FILES
  cold.md   OK (edited 3 days ago)
  icp.md    OK
  offer.md  MISSING - run /cold offer

LIVE (FoxReach)
  Active campaigns: 2   Unread replies: 5 (1 uncategorized) - run /cold triage

CAMPAIGN
  Last import: <campaignId>, <n> leads (<date>)
  Last send:   <campaignId> at <date> (<n> days ago)

EXPERIMENT
  Active: <experiment id>
    Variable: <variable> (Tier <n>)
    Arms:     <arm_a> vs <arm_b>
    Days:     <elapsed> of <minDaysBeforeRead>
  Last concluded: <id and outcome, or none yet>

BELIEFS
  <one line per belief from .cold/beliefs.md, or "none yet">

PENDING REVIEW
  WARN proposed cold.md diff at .cold/proposed-diff.patch
    From:   <experiment id>, outcome as recorded in its decision.md
    Review: cat .cold/proposed-diff.patch
    Accept: git apply .cold/proposed-diff.patch && rm .cold/proposed-diff.patch
    Reject: rm .cold/proposed-diff.patch

TRUST
  Approved-diff streak: <n> of <autoCommitAfterApprovedStreak>   Auto-commit: <on|off>

DECISIONS (last 3)
  - <date> <summary>

NEXT
  -> <single most important action>
```

Copy numbers (sample sizes, rates, p-values) only from the files that hold them. Never estimate "ready to read" from the live line; readiness comes from the protocol, `minSamplePerVariant` and `minDaysBeforeRead`, and `/cold learn` checks the real counts.

Variations:
- No active experiment and no campaign: suggest `/cold leads` then `/cold experiment`.
- Experiment running but `minDaysBeforeRead` not reached: show "Days: 3 of 7" and say to wait.
- A guard breach logged in `.cold/decisions.md` since the last report: show it under EXPERIMENT as `WARN guard breach on <date>: <reason>`.

### Step 5 - Suggested next action (always last)

| Current state | Suggested next |
|---|---|
| No `cold.md`, `icp.md` or `offer.md` | `/cold icp <url>` |
| Has `icp.md`, no `offer.md` | `/cold offer` |
| Has `cold.md`, no `last-import.json` | `/cold leads --csv ./prospects.csv` |
| Import done, no `last-send.json`, no active experiment | `/cold experiment` |
| Active experiment, no drafts | `/cold draft` |
| Drafts ready, no `last-send.json` | `/cold send` |
| Unread replies (live line) | `/cold triage` |
| Active experiment, days remaining | "Wait N more days, then /cold learn" |
| Active experiment, days elapsed | `/cold learn` |
| Pending diff | "Review and accept or reject the proposed diff" |
| Diff resolved, no active experiment | `/cold experiment` (next tier) |

When two rows apply, a pending diff wins, then unread replies, then the earliest row in the table.

## Constraints

- **Read-only.** Never modify `.cold/` or any FoxReach state.
- The live line is the only network call: two read requests, nothing else. Use `/cold report` for numbers.
- Fast: if FoxReach does not answer within the timeout, print the dashboard without it.

## Output

- Terminal dashboard only; no files written.

## References

- Spec: https://cold.md
- FoxReach-side numbers: `/cold report`
- CLI: https://www.foxreach.io/docs/sdks/cli
