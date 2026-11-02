---
description: Run any step of the cold outreach loop - init, icp, offer, research, leads, draft, send, experiment, learn, triage, status, report, audit, lint. Dispatches to the right cold.md skill.
argument-hint: "init | icp | offer | research | leads | draft | bump | breakup | lint | send | experiment | learn | triage | status | report | audit [args...]"
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebFetch, WebSearch
---

# /cold

Router for the cold.md suite. Every step of the outbound loop, one command.

## Usage

```
/cold init [--upgrade]            Set up .cold/ in this repo (wizard), check the FoxReach key
/cold icp [url]                   Build or refine icp.md from a URL or Q&A, validated by web search
/cold offer                       Refine the value prop from competitor and market research -> offer.md
/cold research --candidates <csv> [--depth light|deep]
                                  Per-lead research bundles for a personalization experiment
/cold leads [--csv path | --finder] [--count N]
                                  Import a CSV or source from FoxReach Lead Finder, ICP-score, verify, import
/cold draft <lead>                Draft a spec-conformant opener (variant pair if an experiment is active)
/cold bump <lead>                 Draft sequence step 2
/cold breakup <lead>              Draft the last step
/cold lint                        Check cold.md and icp.md against the spec
/cold send                        Create the FoxReach campaign with pre-flight checks, then start it
/cold experiment                  Design the next A/B test from the variable ladder
/cold learn                       Read per-variant results, run the z-test, propose a cold.md diff
/cold triage                      Categorize unread replies, draft answers from ## Objections
/cold status                      Beliefs, running experiments, pending diffs, next step
/cold report [daily|weekly]       Digest: sending, replies, account health, experiments, credits
/cold audit <domain>              DNS + account health check for a sending domain
```

## Dispatch table

| Subcommand | Skill | Needs FOXREACH_API_KEY |
|---|---|---|
| `init` | inline (below) | Yes |
| `icp` | `cold-icp` | No (optional Lead Finder count) |
| `offer` | `cold-offer` | No |
| `research` | `cold-research` | No |
| `leads` | `cold-leads` | Yes |
| `draft`, `bump`, `breakup`, `lint` | `cold-draft` | No |
| `send` | `cold-send` | Yes |
| `experiment` | `cold-experiment` | No |
| `learn` | `cold-learn` | Yes |
| `triage` | `cold-triage` | Yes |
| `status` | `cold-status` | No (live line if set) |
| `report`, `audit` | `cold-report` | `report` yes, `audit` no (richer with it) |

## Behavior

1. Parse the subcommand from `$ARGUMENTS`. No subcommand: print the Usage block and run `/cold status`.
2. For everything except `init`, `icp`, `lint`, `draft`, `bump`, `breakup` and `audit`: require `.cold/config.json`. Missing: tell the user to run `/cold init` and stop.
3. A config with `"version": "0.2"` still works. Skills fall back to v0.3 defaults; suggest `/cold init --upgrade` once per session.
4. File requirements:
   - `offer`, `leads` need `icp.md`
   - `research` needs a candidates CSV (`id,email,firstName,lastName,company,title`)
   - `draft` family and `lint` need `cold.md`
   - `send` needs `cold.md`, `icp.md`, `.cold/last-import.json`
5. Key requirements per the table. Missing key: print `export FOXREACH_API_KEY=otr_...` and where to create one (Settings > Integrations > API Keys in the FoxReach app), then stop.
6. Invoke the skill and output in the format it defines.

## /cold init (inline)

### Step 1 - Prerequisites
- `command -v foxreach`. Missing: `pip install foxreach-cli` (or `pipx install foxreach-cli`) and stop.
- `FOXREACH_API_KEY` set, or `foxreach config show` lists a key. Missing: explain Settings > Integrations > API Keys, `export FOXREACH_API_KEY=otr_...` or `foxreach config set-key --key otr_...`, and stop.
- Confirm: "Set up cold.md in `<cwd>`? (Y/n)"
- `--upgrade`: read the existing `.cold/config.json`, keep every answer it has, ask only the questions for missing keys, write version 0.3. Never touch `trust.json`, `beliefs.md`, `decisions.md` or `experiments/`.

### Step 2 - Wizard

One question at a time, Enter accepts the default:

1. Per-lead personalization (2 web searches per prospect: news, posts, hires)? [y/N]
2. Policy-level web research for ICP and offer? [Y/n]
3. Where do leads come from? `csv` or `lead-finder` (FoxReach people database, paid plans) [csv]
4. Verify emails before import (FoxReach verification credits; only good/bad verdicts are charged)? [Y/n]
5. Provider matching (send the first email from a mailbox on the recipient's provider)? `auto`, `on`, `off` [auto]
6. Minimum sample per variant before calling a winner? [100]
7. Minimum days before reading results? [7]
8. Bounce-rate guard? [0.05]
9. Auto-commit cold.md diffs after 3 approved in a row? [Y/n]

### Step 3 - Write `.cold/config.json`

```json
{
  "version": "0.3",
  "personalization": { "perLead": <1>, "perLeadBudget": "2-search-queries-per-lead" },
  "research": { "policyLevelEnabled": <2>, "maxQueriesPerInvocation": 5, "cacheTtlDays": 14 },
  "leads": { "source": "<3>", "verifyBeforeSend": <4>, "dropQualities": ["bad"] },
  "sending": { "espMatching": "<5: auto|true|false>", "timezone": "UTC", "dailyLimit": 50 },
  "experiments": { "currentTier": 1, "minSamplePerVariant": <6>, "minDaysBeforeRead": <7>,
                   "significanceLevel": 0.05, "autoAdvanceTier": false },
  "guards": { "bounceRateThreshold": <8>, "notInterestedRateThreshold": 0.30,
              "autoPauseOnGuardBreach": true, "minAccountHealth": 70 },
  "trust": { "humanApprovalRequired": true, "autoCommitAfterApprovedStreak": <9 ? 3 : 999> },
  "foxreach": { "baseUrl": "https://api.foxreach.io", "docsUrl": "https://www.foxreach.io/docs",
                "openapiUrl": "https://api.foxreach.io/openapi-public.json", "cliPath": "foxreach" }
}
```

If `cold.md ## Audience` names a region, ask for the sending timezone too (e.g. US East -> `America/New_York`).

### Step 4 - `.cold/trust.json` (only if missing)

```json
{ "approvedDiffStreak": 0, "autoCommit": false }
```

### Step 5 - Cache the public API spec

```bash
mkdir -p .cold/docs-cache
curl -fsSL https://api.foxreach.io/openapi-public.json -o .cold/docs-cache/foxreach-openapi.json
```

On failure, warn and continue. Skills fall back to https://www.foxreach.io/docs.

### Step 6 - Scaffold (only files that are missing)

- `cold.md` from this plugin's `skills/cold-draft/references/minimal.cold.md`
- `icp.md`, `offer.md`: a header and a one-line TODO pointing at `/cold icp` and `/cold offer`
- `.cold/beliefs.md` (`# Beliefs` + "No experiments concluded yet."), `.cold/decisions.md` (`# Decisions` + "No diffs applied yet."), `.cold/experiments/.gitkeep`, `.cold/research/.gitkeep`

Suggest adding `.cold/docs-cache/` to `.gitignore`. Everything else in `.cold/` is meant to be committed.

### Step 7 - Check the account

Run these and print one line each. A 401/403 means a bad key: say so and stop.

```bash
foxreach campaigns list --limit 1 --json      # auth works
foxreach accounts list --json                 # sending mailboxes + count
foxreach verification credits --json          # only if leads.verifyBeforeSend
foxreach lead-finder credits --json           # only if leads.source == lead-finder
```

No connected mailboxes: say `/cold send` will stop until one is connected and warmed (https://www.foxreach.io/docs/get-started/connect-email-account).

### Step 8 - Next steps

```
cold.md is set up in <cwd>
  Config: .cold/config.json (v0.3)
  Leads: <csv|lead-finder>, verify <on|off>, provider matching <auto|on|off>
  Mailboxes: <n> connected

Next:
  /cold icp https://your-site.com    Build icp.md
  /cold offer                        Sharpen the value prop
  /cold leads                        Source, score and verify leads
```

## The full loop

```
/cold init                          # once
/cold icp https://your-company.com  # who
/cold offer                         # what
/cold leads --finder --count 200    # who specifically
/cold experiment                    # pick the next A/B
/cold draft <lead>                  # control + variant copy
/cold send                          # pre-flight, create, start
# wait minDaysBeforeRead; run /cold triage daily
/cold learn                         # z-test, proposed cold.md diff
/cold status                        # what we know, what's next
/cold report weekly                 # digest
```

## References

- Spec: https://cold.md and `spec/cold-md-v0.md` in https://github.com/foxreach/cold-md
- FoxReach CLI: https://www.foxreach.io/docs/sdks/cli
- FoxReach API (X-API-Key auth): https://www.foxreach.io/docs/introduction
- A/B variants in FoxReach: https://www.foxreach.io/docs/product/ab-testing
