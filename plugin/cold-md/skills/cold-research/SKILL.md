---
name: cold-research
description: Run per-lead web research on a CSV of leads, write one evidence bundle per lead with a citable hook (or a skip reason), and optionally split leads into A/B arms for a personalization experiment. Uses parallel sub-agents in batches. Use when the user says "research these leads", "personalize this list", "find a hook per lead", runs `/cold research`, or when cold-experiment declares personalization as the variable under test.
---

# cold-research

Bridges `cold-leads` (a list) and `cold-draft` (copy) with **per-lead observable facts** the draft step can cite. No FoxReach calls; web research only.

## When to use

- An experiment from `cold-experiment` tests **personalization** (personalized opener vs generic)
- User says "research each of these leads", "find a hook per lead", `/cold research`
- The list is small enough to be worth real research (about 200 leads or fewer). For bigger lists, use cheap signals from the CSV only.

## Arguments

```
/cold research [--candidates <csv>] [--output-dir <path>] [--depth light|deep]
               [--batch-size 10] [--max-batches 5] [--arms 50,50] [--limit N]
```

- `--candidates`: CSV of leads. Default: `.cold/verified.csv` if it exists, else `.cold/import.csv`. Needs an `email` column and a `company` column. Uses when present: `id`, `firstName`/`first_name`, `lastName`/`last_name`, `title`, `website`, `linkedinUrl`/`linkedin_url`, `city`.
- `--output-dir`: default `.cold/experiments/<active id>/research/` when `.cold/experiments/.active` exists, otherwise `.cold/research/lead-personalization/`.
- `--depth`: `light` = 1 WebSearch per lead. `deep` = 2 searches plus one fetch of the company website. Default `light`. Never exceed `personalization.perLeadBudget` from `.cold/config.json` (default 2 search queries per lead).
- `--batch-size`, `--max-batches`: leads per sub-agent and how many run at once.
- `--arms`: build `assignments.json` for a two-arm test (counts per arm).
- `--limit`: research only the first N rows.

## Bundle key

Each bundle is named `<leadKey>.md`. `leadKey` = the CSV `id` when present, otherwise the email hash: the first 12 hex characters of `sha256(lowercase(trim(email)))`.

```bash
printf '%s' "jane@acme.io" | tr 'A-Z' 'a-z' | shasum -a 256 | cut -c1-12
```

`cold-draft` looks bundles up by the same key.

## Process

### Step 1 - Validate inputs

- The CSV exists and has `email` and `company`. If not, stop and print the columns it does have.
- If writing into an experiment folder, that folder must exist; if it does not, tell the user to run `/cold experiment` first.
- Read `cold.md` (`## Audience`, `### Not for`, `## Voice`, `## Banned`) and `icp.md` (pain signals). Researchers need these to know what counts as a useful hook and what disqualifies a lead.
- Skip leads that already have a bundle newer than `research.cacheTtlDays` (default 14).

### Step 2 - Split into batches

Chunk the rows into batches of `--batch-size`. Write each batch to `.cold/tmp/research-batches/batch<N>.json` so sub-agents can read them independently.

### Step 3 - Spawn parallel research agents

For each batch (at most `--max-batches` at once), spawn a `general-purpose` sub-agent with this prompt, filled in from `cold.md` and `icp.md`:

```
You are researching <N> leads for a cold outreach campaign.
Audience: <cold.md ## Audience, one line>. Not for: <### Not for list>.
Pain signals worth citing: <icp.md pain signals>.

Read .cold/tmp/research-batches/batch<N>.json. For each lead, run
<1 | 2> WebSearch call(s), for example:
  "<company>" <city or website domain> <the pain signal most likely to be public>
<deep only: also fetch the company website homepage once.>

Look for ONE observable, verifiable fact that connects to the pain
signals: something on their site, a public post, a job listing, a
review pattern, a product change. Record the source URL for every fact.

status: send  when you found a citable fact AND the lead is not in "Not for"
status: skip  otherwise, with the reason (see skip reasons below)

Write one bundle per lead at <output-dir>/<leadKey>.md using the bundle
template below exactly.

Rules: never invent a fact, number, review count or name. No em dashes.
Do not write an email; write the hook only. Do not edit files outside
<output-dir>. Do not spawn sub-agents. Do not call FoxReach.

Return:
batch<N>: X send, Y skip
- <leadKey>: send | <one-line hook>
- <leadKey>: skip | <reason>
```

Run the agents in the background and wait for all of them before continuing.

### Step 4 - Aggregate

Read every bundle in the output dir and parse the frontmatter. Write `bundles-summary.json` next to the output dir:

```json
{
  "total": 0,
  "send": 0,
  "skip": 0,
  "byStrength": {"high": 0, "medium": 0, "low": 0},
  "skipReasons": {"not_found": 0, "disqualified": 0, "identity_mismatch": 0, "no_signal": 0}
}
```

Fill the counts from the bundles; never estimate them.

### Step 5 - Arm assignments (only with `--arms`)

Sort send-grade bundles by `signalStrength` (high, medium, low), then by `leadKey` for stability. Take the first N for arm A (personalized). Take the next N leads from the CSV that were not researched, or were researched and skipped for `no_signal` only, for arm B (generic). Never put a disqualified lead in either arm.

Write `assignments.json` next to the output dir:

```json
{
  "experimentId": "<id>",
  "createdAt": "YYYY-MM-DD",
  "armA": [{"leadKey": "...", "email": "...", "firstName": "...", "signalStrength": "high"}],
  "armB": [{"leadKey": "...", "email": "...", "firstName": "..."}]
}
```

If there are fewer send-grade leads than the arm size, say so and ask whether to shrink both arms or research more leads.

### Step 6 - Print summary

```
Research complete: <total> leads -> <send> send-grade
  high <n>   medium <n>   low <n>
  skipped <n>: <reason counts>

Bundles:     <output-dir>
Assignments: <path> (arm A <n>, arm B <n>)

Next:
  /cold draft   per-lead drafts from the bundles
```

## Bundle template

```markdown
---
leadKey: <id or email hash>
email: <email>
name: <full name or empty>
title: <title or empty>
company: <company>
researchDate: <YYYY-MM-DD>
depth: <light|deep>
signalStrength: <high|medium|low>
status: <send|skip>
skipReason: <empty or one of the skip reasons>
---

# <Name> - <Company>

## Facts (each with a source)
- <observable fact> (<source URL>)
- <second fact, if any> (<source URL>)

## Hook
<One sentence the opener can cite verbatim, built only from the facts above.>

## Recommendation
**<Send|Skip>.** <one-line reason>
```

`signalStrength`: high = a specific, recent, verifiable fact tied to an `icp.md` pain signal; medium = a specific fact loosely tied to the pain; low = generic but true.

## Skip reasons

| Reason | Example |
|---|---|
| `not_found` | No result matches the company or person |
| `disqualified` | Matches `cold.md ### Not for` (wrong size, wrong segment, acquired by a group) |
| `identity_mismatch` | Email domain, company and public profile point to different organizations |
| `no_signal` | Lead fits, but nothing citable was found |

## Constraints

- Opt-in only: runs when invoked, or when `cold-experiment` declares personalization (and `personalization.perLead` is true, or the user confirms).
- Real facts only. If nothing citable is found, `status: skip`. **Do not fabricate hooks.**
- Sub-agents own their batch top to bottom; they do not spawn agents, commit, push, write outside the output dir, or touch FoxReach.
- Cost scales with leads x searches per lead; show the user the planned number of searches (`rows x 1` for light, `rows x 2` plus fetches for deep) before starting when it is above 100.

## References

- Spec: https://cold.md
- `cold-leads` (supplies the CSV), `cold-draft` (reads bundles by `leadKey`), `cold-experiment` (decides whether personalization is under test)
