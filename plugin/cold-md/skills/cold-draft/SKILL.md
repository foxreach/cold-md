---
name: cold-draft
description: Draft cold email openers, bumps, breakups and replies from a cold.md file, write FoxReach-ready step templates (with {{variables}} and optional spin syntax) and experiment variants, and lint cold.md or drafts against the spec. Use when the user asks to write a cold email, sequence, bump, breakup, reply or objection response, runs `/cold draft`, `/cold bump`, `/cold breakup` or `/cold lint`, or when a cold.md file exists at the repo root. Enforces the cold.md spec (https://cold.md): banned phrases, voice rules, proof list, sequence constraints and audience disqualifiers.
---

# cold-draft

Drafts outreach that conforms to your `cold.md`. The spec lives at [cold.md](https://cold.md); this skill is the reference implementation. Pairs with `cold-icp`, `cold-leads`, `cold-research`, `cold-send`, `cold-triage` and `cold-report`.

## When to use

- User asks for a cold email, opener, bump, follow-up, breakup, or a reply to an inbound message.
- `/cold draft [<lead>]`, `/cold bump <lead>`, `/cold breakup <lead>`, `/cold lint [<file>]`.
- A `cold.md` is present at `./cold.md` or the user points at one.

## Step 1 - Locate the cold.md

Stop at the first hit:

1. `$COLD_MD` (absolute path).
2. `./cold.md`.
3. First match from `git ls-files | grep -i 'cold\.md$'`.
4. None found: ask for the path or offer to scaffold from `references/minimal.cold.md`.

## Step 2 - Parse the spec

Read the whole file and extract:

- **Frontmatter** (optional YAML). Refuse if `coldMdVersion` is a major version other than `"0"`.
- **Identity**, **Audience** (with `### Not for`), **Value**, **Voice** (`### Do`, `### Don't`), **Proof**, **Sequence** (numbered H3 slots), **Objections** (`> "quoted objection"` + preferred reply), **Banned**.

If a section the task needs is missing (for example an opener with no `## Sequence`), say so before writing anything.

## Step 3 - Generate, obeying the contract

1. **Pick the slot.** "opener" = slot 1, "bump" = slot 2, "breakup" = slot 3, or an explicit number. Ask if unclear.
2. **Draft.** Match the slot's subject rule, word count and content rule exactly.
3. **Match voice.** Every `### Do` rule visibly followed, every `### Don't` obeyed.
4. **Cite only from `## Proof`.** No invented numbers, clients or testimonials.
5. **Filter banned strings** (see below). Regenerate up to 3 times, then stop and surface the conflict.
6. **Tag the output** with slot, word count and the proof lines cited.

```
Subject: [subject]

[body]

---
Slot: [N]
Word count: [X] (longest spin expansion)
Proof cited: [lines from ## Proof]
Variables: [{{firstName|there}}, {{company}}]
```

### Audience check

Given a target contact (name, company, title), compare against `## Audience` and `### Not for`: clear fit, proceed; clear disqualifier, refuse and quote the rule; unclear, ask.

### Replying to inbound

1. Match the inbound against `## Objections` by intent, not exact wording.
2. On a match, start from the preferred reply and edit only to reference what they said.
3. No match: say "no objection pattern matches this reply" and offer to draft fresh or add an objection entry.

## FoxReach variables and spin syntax

When the copy is headed for FoxReach (`/cold send`), write it as **one template per sequence step**, not one email per lead. FoxReach fills variables from each lead when it sends.

**Variables** use double braces:
- Standard: `{{firstName}}`, `{{lastName}}`, `{{fullName}}`, `{{email}}`, `{{company}}`, `{{title}}`, `{{phone}}`, `{{website}}`, `{{linkedin}}`, `{{senderName}}`, `{{senderEmail}}`, `{{signature}}` (snake_case forms such as `{{first_name}}` also work).
- Custom fields: `{{<name>}}` for any custom field on the lead, for example `{{hook}}` when cold-leads imported a `hook` column as `custom:hook`. Use only names listed in `.cold/last-import.json` `customFields`.
- Fallbacks: `{{firstName|there}}`. A missing value renders as empty text, so give a fallback to any variable that can be blank. A per-lead hook always gets a generic fallback sentence: `{{hook|<generic line that still reads well>}}`.
- Single braces around a name (`{firstName}`) are a typo: FoxReach treats `{word}` as a broken spin block. Fix it to double braces.

**Spin syntax** (optional) varies wording per send: `{Hi|Hello|Hey} {{firstName|there}},`
- At least two options per block, separated by `|`. No empty options, no nested blocks.
- FoxReach validates spin syntax when a step is created or updated and rejects the step on an error; lint it here first so `/cold send` does not fail halfway.
- Every option must pass `## Banned` and `## Voice` on its own, and every combination must fit the slot's word limit. Count words on the longest expansion.
- Do not use spin to run an A/B test. Experiments use FoxReach variants (see Experiment mode), which are attributed per send; spin options are not.

Preview a template for one real lead by substituting their row from `.cold/import.csv` (or `.cold/verified.csv`) and picking the first spin option, so the user sees what a recipient gets.

## Banned-phrase enforcement

`## Banned` is a hard gate. Check case-insensitively against the subject, the body, every spin option and every variable fallback:

```
for phrase in banned:
    if phrase.lower() in text.lower(): regenerate
```

After 3 failed regenerations, stop and tell the user. Never ship a draft with a banned phrase.

## Lint mode (`/cold lint [<file>]`)

Read-only. With no argument, lint `./cold.md`, `./icp.md` (if present) and every draft under `.cold/drafts/`. Report each finding as `file:line rule - fix`. Exit status in the summary: `pass`, or `N problems`.

`cold.md` checks:
- Frontmatter, if present, has `coldMdVersion: "0"`.
- All eight sections exist: Identity, Audience, Value, Voice, Proof, Sequence, Objections, Banned.
- `## Value` is one sentence.
- `## Sequence` slots are numbered H3s (`### 1. ...`) and each has a constraint line.
- `## Objections` entries are `> "..."` followed by a reply.
- `## Banned` is a flat list; the text of `cold.md` outside `## Banned` contains none of the banned strings.

Draft and template checks:
- Banned phrases (including spin options and fallbacks), voice rules, slot word counts.
- Proof: any number, client name or claim not in `## Proof` is flagged.
- Variables: unknown names, single-brace typos, variables without a fallback that are blank for some lead in the import file.
- Spin syntax: unbalanced braces, single-option blocks, empty options, nested blocks.

`icp.md` checks: every section filled (no `[placeholder]`), at least one title, at least two observable pain signals.

## When you can't comply

Stop and ask when: a required section is missing, the contact fails the audience check, the user wants to cite a fact not in `## Proof`, or the banned list and voice rules conflict. Silent degradation is a bug.

## Experiment mode

If `.cold/experiments/.active` exists and its `protocol.md` is valid, write one template set per arm instead of a single draft.

```
ACTIVE=$(cat .cold/experiments/.active)
PROTO=.cold/experiments/$ACTIVE/protocol.md
```

The protocol declares `variable` (`subject` | `opener` | `cta` | `cadence` | `tone`), `arms` and `cohort_size`.

| Variable | What differs between arms | What stays constant |
|---|---|---|
| subject | Subject line | Body, CTA, tone |
| opener | First 2 lines of the body | Subject, rest of body, CTA |
| cta | Last paragraph (the ask) | Subject, opener, middle |
| cadence | Nothing in the copy; delays differ (handled by cold-send) | All copy |
| tone | Voice across the message | Subject pattern, CTA framing |

Output, keyed by `importId` from `.cold/last-import.json`:

```
.cold/drafts/<importId>/
  arm_a_<descriptor>/step-<n>.md   # control: becomes the FoxReach step
  arm_b_<descriptor>/step-<n>.md   # challenger: becomes variant B
```

Each `step-<n>.md` has frontmatter (`arm`, `step`, `delayDays`, `variable`) and then the subject and body, using variables as above. Arms differ **only** in the variable under test. For a personalization test, the personalized arm uses `{{hook|...}}` and the generic arm does not.

FoxReach variants are labelled A and B (`cold-send` creates both with `foxreach sequences variants add`), so the arm descriptor is for your files; `cold-send` maps each arm to its FoxReach variant ID and stores the mapping. Guide: https://www.foxreach.io/docs/product/ab-testing

Per-lead previews (optional): render 3 sample leads per arm into `arm_*/preview/<leadKey>.md`, where `leadKey` is the CSV `id` or the first 12 hex characters of `sha256(lowercase(trim(email)))`. If a research bundle exists for the lead (`.cold/experiments/<id>/research/<leadKey>.md` or `.cold/research/lead-personalization/<leadKey>.md`), use its `## Hook` line for `{{hook}}`.

Summary:

```
Experiment <id>: <variable>
  arm_a_<descriptor>: <n> steps
  arm_b_<descriptor>: <n> steps
Lint: <pass | N problems>
Next: /cold send
```

If the protocol is missing or invalid, print the error and fall back to single-draft mode.

## References

- `references/spec-v0.md` - the current spec (kept in sync with `spec/cold-md-v0.md`).
- `references/minimal.cold.md` - starter template when no cold.md exists.
- `references/foxreach.cold.md` - a real cold.md.
- Canonical spec: https://cold.md
