---
name: cold-experiment
description: Design the next A/B experiment in the cold.md loop. Reads the current tier, picks the one variable to test, writes the control and variant copy, sample size, guards and decision rule into a protocol under .cold/experiments/, and marks it active for /cold draft, /cold send and /cold learn. Use after /cold leads and before /cold draft, or when the user says "design the next experiment", "what should we test next", "set up the A/B" or runs /cold experiment.
---

# cold-experiment

Designs one single-variable experiment at a time. It writes files only; it calls no API.

## When to use

- `.cold/config.json` exists and `cold.md` + `icp.md` are filled in
- No experiment is active, or the active one has been concluded by `/cold learn`

## Inputs

- `.cold/config.json`: `experiments.currentTier`, `minSamplePerVariant`, `minDaysBeforeRead`, `significanceLevel`; `guards.*`
- `.cold/beliefs.md`: concluded winners (tier prerequisites)
- `cold.md`: current `## Sequence` copy (the control), `## Voice`, `## Banned`
- `.cold/last-import.json` (optional): lead count, provider split

## Step 1: Tier and prerequisites

Read `experiments.currentTier` (default 1). For tier > 1, `.cold/beliefs.md` must hold a stable winner for the previous tier (a `decision.md` with `Status: winner`, applied to cold.md). If not:

```
Tier <N> needs a stable winner at tier <N-1> first.
Current state: <what beliefs.md shows>.
Conclude the active experiment with /cold learn, or set experiments.currentTier
in .cold/config.json to override.
```

Stop.

## Step 2: Pick the variable

| Tier | Variable | Arms (pick 2) | Design | Min sample per arm | Min days |
|---|---|---|---|---|---|
| 1 | `subject` | statement / question / number-led | variant | 100 | 7 |
| 2 | `opener` (lines 1-2) | compliment / observation / direct-ask | variant | 150 | 10 |
| 3 | `cta` | calendar-link / reply-to-confirm / low-friction yes-no | variant | 200 | 14 |
| 4 | `cadence` | days between steps, e.g. 3 vs 5 | two-campaign | 300 | 21 |
| 4 | `esp-matching` | provider matching on vs off | two-campaign | 300 | 21 |
| 5 | `tone` | casual / formal | variant | config value | 30 |

- Sample size per arm = the larger of `experiments.minSamplePerVariant` and the tier minimum (the ladder in `spec/2026-04-28-autoresearch-design.md`). Min days = the larger of `experiments.minDaysBeforeRead` and the tier minimum.
- **variant** design: one campaign, one step gets FoxReach variants A (control) and B (variant), split 50/50 by weight. Variants carry their own subject and body only.
- **two-campaign** design: delays and provider matching are campaign or step settings, not variant settings, so they cannot be A/B variants. The test runs as two campaigns that differ only in that setting, with leads split randomly in half. It costs twice the setup, so it sits late on the ladder.
- `esp-matching` only makes sense when the senders include both Google and Microsoft mailboxes and the leads include both Google and Microsoft recipients (`foxreach campaigns esp-mix` on the last campaign, or `last-import.json.providers`). Otherwise there is nothing to match: offer `cadence` instead.
- Tier 5 changes the brand voice. Refuse unless the user passes `--allow-tier-5`, and say why.
- At tier 4 pick one of `cadence` or `esp-matching` with the user; the other stays for a later run.

Check the lead count: two arms need `2 x sample size` leads in the campaign. If `last-import.json` has fewer, say how many more `/cold leads` must bring in.

## Step 3: Experiment id

`<YYYY>-W<ISO week>-<variable>-<arm-a-short>-vs-<arm-b-short>`, for example `2026-W45-subject-statement-vs-question`.

## Step 4: Write the protocol

`.cold/experiments/<id>/protocol.md`:

```yaml
---
id: 2026-W45-subject-statement-vs-question
created: 2026-11-03
variable: subject
design: variant              # variant | two-campaign
step: 1                      # the sequence step under test (step numbers start at 1)
hypothesis: |
  Question subjects will get a higher interested-reply rate than statement
  subjects for <ICP audience>, because <reason from icp.md pain signals>.

arms:
  - id: arm_a_statement      # control, FoxReach variant A
    role: control
    pattern: Declarative, under 8 words, no question mark
  - id: arm_b_question       # FoxReach variant B
    role: variant
    pattern: Question, under 8 words, ends with ?

control:                     # current cold.md copy for this step, verbatim
  subject: "<subject>"
  body: |
    <body>
variant:                     # same copy, only the tested element changed
  subject: "<subject>"
  body: |
    <body>

sample_size_per_arm: 100
min_days_before_read: 7
significance_level: 0.05     # experiments.significanceLevel
min_delta_pp: 2              # minimum absolute lift, percentage points

guard:
  bounce_rate_max: 0.05          # guards.bounceRateThreshold
  not_interested_rate_max: 0.30  # guards.notInterestedRateThreshold

success_criteria:
  metric: interested replies / sent, per arm
  test: two-proportion z-test
  decision_rule: |
    Winner when |delta| >= min_delta_pp AND p < significance_level
    AND the 95% CI of the delta excludes zero.

extension_policy:
  max_extensions: 2
  extension_step_pct: 50

# Filled by /cold send. Never fill these by hand or by guess.
campaignId: null
campaignIds: []              # two-campaign design: [control campaign, variant campaign]
sequenceId: null             # variant design: the step that carries the variants
variantIds: { control: null, variant: null }
variantLabels: { control: A, variant: B }
---
```

For a `two-campaign` design, `control` and `variant` hold the setting instead of copy (for example `delayDays: [0, 3, 3]` vs `[0, 5, 5]`, or `espMatching: false` vs `true`), and the copy is identical in both campaigns.

Below the frontmatter, in prose:

- **Hypothesis**, grounded in `icp.md` and any `.cold/research/` findings.
- **Arms**: the pattern, the example copy, and why each might win.
- **Held constant**: everything except the variable (body, CTA, send window, accounts, cadence, tone, as applicable).
- **How the copy reaches FoxReach**: `/cold draft` refines the control and variant copy within the arm patterns. `/cold send` creates the step with the control copy, adds variant A (control copy) and variant B (variant copy) to it with `foxreach sequences variants add`, reads both variant IDs back and writes them into this file.

Both arms must respect `cold.md ## Voice` and `## Banned`.

## Step 5: Mark active

If `.cold/experiments/.active` already names an experiment without a `decision.md`, ask: "Experiment `<old-id>` is still running. Conclude it with /cold learn first. Override? (y/N)". Then:

```bash
mkdir -p .cold/experiments/<id>
echo <id> > .cold/experiments/.active
```

## Step 6: Summary

```
Experiment: <id>
  Variable: <variable> (tier <N>), design: <variant|two-campaign>
  Arms: <arm a> (control) vs <arm b>
  Sample: <n> sends per arm, read after <d> days
  Test: two-proportion z-test, alpha <a>, min lift <pp>pp
  Guards: bounce under <x>%, not-interested under <y>%
  Leads needed: <2 x n> (have <m>)

Next: /cold draft, then /cold send
```

## Constraints

- One active experiment at a time; concurrent tests confound each other.
- One variable per experiment, two arms.
- The ladder is strict; skipping a tier needs a manual `currentTier` override.
- Tier 5 needs `--allow-tier-5`.
- Variant IDs come only from `foxreach sequences variants add` / `variants list` output, written by `/cold send`.

## Output

- `.cold/experiments/<id>/protocol.md`
- `.cold/experiments/.active`

## References

- A/B testing in FoxReach: https://www.foxreach.io/docs/product/ab-testing
- `/cold learn` consumes the protocol after `min_days_before_read`
