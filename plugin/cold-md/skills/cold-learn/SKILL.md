---
name: cold-learn
description: Read the active experiment's per-variant results from FoxReach (inbox categorize-stats), check the bounce and not-interested guards, run a two-proportion z-test on interested-reply rate, and record the outcome. On a winner it updates beliefs.md and decisions.md, proposes a cold.md diff (or applies it once trust is earned) and tells the user how to promote the winning variant in the FoxReach app. Use once min_days_before_read have passed since /cold send, or when the user says "read the experiment", "what did we learn", "is the test done" or runs /cold learn.
---

# cold-learn

Decides winner, inconclusive, or extend for the active experiment, under the trust ladder.

## Inputs

- `.cold/experiments/.active` and `.cold/experiments/<id>/protocol.md` (`design`, `step`, `variantIds` or `campaignIds`, thresholds)
- `.cold/last-send.json` (`campaignId`, `sentAt`, `accountIds`)
- `.cold/trust.json`, `.cold/config.json` (`guards.*`, `trust.*`, `experiments.autoAdvanceTier`)
- `cold.md`
- `FOXREACH_API_KEY`

## Step 0: Streak bookkeeping (every run, first)

```bash
PATCH=.cold/proposed-diff.patch
PREV=$(jq -r '.coldMdHashAtPropose // empty' .cold/trust.json)
NOW=$(shasum -a 256 cold.md | awk '{print $1}')
if [ ! -f "$PATCH" ] && [ -n "$PREV" ]; then
  if [ "$PREV" != "$NOW" ]; then F='.approvedDiffStreak += 1'   # patch applied
  else F='.approvedDiffStreak = 0'; fi                          # patch rejected
  jq "$F | del(.coldMdHashAtPropose)" .cold/trust.json > .cold/trust.tmp && mv .cold/trust.tmp .cold/trust.json
fi
T=$(jq -r '.trust.autoCommitAfterApprovedStreak' .cold/config.json)
S=$(jq -r '.approvedDiffStreak' .cold/trust.json)
[ "$S" -ge "$T" ] && jq '.autoCommit = true' .cold/trust.json > .cold/trust.tmp && mv .cold/trust.tmp .cold/trust.json
```

A patch still on disk means the last proposal is pending: no streak change.

## Step 1: Ready to read?

- No `.active`: "No active experiment. Run /cold experiment." Stop.
- Variant design with `variantIds.control` or `variantIds.variant` null: "/cold send did not record the variant IDs. Run `foxreach sequences list --campaign <id> --json` and add them to the protocol." Stop.
- `now - sentAt` below `min_days_before_read`: "Needs <n> more days." Stop. Never pull stats early; peeking biases the read.

## Step 2: Pull stats

Variant design (one campaign, variants on one step):

```bash
foxreach inbox categorize-stats --campaign "$CID" --step "$STEP" --group-by variant \
  --from "$SENT_AT" --to "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --json \
  > .cold/experiments/$ID/results.json
```

Two-campaign design: run it once per campaign in `campaignIds`, without `--step` and `--group-by` (the whole sequence is under test), and save both.

The CLI prints:

```json
{ "groups": [
  { "key": "<variant id>", "sent": 0, "replied": 0, "interested": 0,
    "not_interested": 0, "out_of_office": 0, "bounce": 0,
    "unsubscribe": 0, "uncategorized": 0 }
] }
```

- `key` is the variant ID (`--group-by variant`), or `"all"` when not grouped. Match keys to `protocol.variantIds`. A `null` key holds sends made before the variants existed; report its `sent` and leave it out of the test.
- `replied` excludes bounce, warmup and unrelated mail. `bounce` counts bounce notices that reached the inbox and were categorized as bounces.
- Replies count only when received inside `--from`/`--to`, and only after they are categorized.

Curl fallback (the response is wrapped in `data`):

```bash
curl -sS "https://api.foxreach.io/api/v1/inbox/categorize-stats?campaignId=$CID&sequenceStep=$STEP&groupBy=variant&fromDate=$SENT_AT&toDate=$NOW_ISO" \
  -H "X-API-Key: $FOXREACH_API_KEY" | jq '.data'
```

## Step 3: Data quality

- **Uncategorized replies.** Any arm with `uncategorized > 0` undercounts interested replies. Tell the user to run `/cold triage` and rerun `/cold learn`. Continue only if they say so, and note it in the decision.
- **Sample size.** Each arm needs `sent >= sample_size_per_arm`. Short: extend (Step 7).

## Step 4: Guards

Per arm: `bounce_rate = bounce / sent`, `not_interested_rate = not_interested / sent`. Also read `foxreach accounts health <id> --json` for each ID in `last-send.json.accountIds` and compute `bounce7d.bounced / bounce7d.sent`.

- Any bounce rate above `guards.bounceRateThreshold`: the experiment is invalid. When `guards.autoPauseOnGuardBreach` is true, run `foxreach campaigns pause "$CID"`. Variant weights cannot go below 1 and cannot be changed through the API, so tell the user to remove the breaching variant in the app ("Remove A/B Test" reverts the step to the control) or fix the accounts. Append the breach to `.cold/decisions.md`. Propose no cold.md change. Stop.
- `not_interested_rate` above `guards.notInterestedRateThreshold`: warn and continue; the result is still informative.

## Step 5: Two-proportion z-test

```python
from math import sqrt, erf
def phi(x): return 0.5 * (1 + erf(x / sqrt(2)))

ra, rb = ia / na, ib / nb                    # interested / sent, a = control
p = (ia + ib) / (na + nb)
z = (rb - ra) / sqrt(p * (1 - p) * (1 / na + 1 / nb))
p_value = 2 * (1 - phi(abs(z)))
delta_pp = (rb - ra) * 100
se = sqrt(ra * (1 - ra) / na + rb * (1 - rb) / nb) * 100
ci = (delta_pp - 1.96 * se, delta_pp + 1.96 * se)
```

## Step 6: Decide

| Condition | Outcome |
|---|---|
| `abs(delta_pp) < min_delta_pp` | inconclusive |
| `p_value >= significance_level` | inconclusive |
| CI contains 0 | inconclusive |
| all three pass | winner = the arm with the higher interested rate |

## Step 7: Inconclusive or extend

Write `.cold/experiments/<id>/decision.md` with `Status: inconclusive`, the numbers per arm (sent, interested, rate), delta, p, CI, the reason, and the next move:

- **Extend** while `max_extensions` is not used up: raise the sample by `extension_step_pct`. The campaign keeps sending to its remaining leads; if it has none left, bring more with `/cold leads` and add them with `foxreach campaigns add-leads "$CID" --lead-ids <ids>` (500 per call). Record the extension in the protocol and wait another `min_days_before_read`.
- **Close** once extensions are used up: mark inconclusive, change nothing in cold.md, and say the next tier can start.

## Step 8: Winner

`decision.md`: `Status: winner`, the winning arm, the numbers, the proposed cold.md edit, and the updated belief. Append to `.cold/beliefs.md`:

```markdown
## Tier <N>: <variable>
- Pattern: <winning pattern>
- Lift: <delta_pp>pp interested-reply rate (95% CI [<lo>, <hi>], p=<p>)
- Sample: n=<na + nb>
- Source: <experiment id>, concluded <date>
```

Write the cold.md change as a unified diff to `.cold/proposed-diff.patch` and snapshot the hash:

```bash
jq --arg h "$(shasum -a 256 cold.md | awk '{print $1}')" '.coldMdHashAtPropose = $h' \
  .cold/trust.json > .cold/trust.tmp && mv .cold/trust.tmp .cold/trust.json
```

**Trust ladder.** `trust.autoCommit` true: `git apply .cold/proposed-diff.patch && rm .cold/proposed-diff.patch` and log "applied automatically, streak <s>". Otherwise:

```
Proposed: .cold/proposed-diff.patch
  Review: cat .cold/proposed-diff.patch
  Accept: git apply .cold/proposed-diff.patch && rm .cold/proposed-diff.patch
  Reject: rm .cold/proposed-diff.patch
Trust streak <s>/<autoCommitAfterApprovedStreak>.
```

**Promote the winner in FoxReach.** Editing variants is a web-app action; print:

```
Promote <arm> in campaign "<name>" (guide: https://www.foxreach.io/docs/product/ab-testing)
  Keep a small test running: pause, set the winner's weight to 9 and the other to 1, resume.
  Or end the test: pause, copy the winner's subject and body, click "Remove A/B Test"
  (this reverts the step to the original control), paste the winning copy into the step, save, resume.
```

Pausing, resuming and writing the winning copy back to the step (after the test is removed) can go through the API on request: `foxreach campaigns pause "$CID"`, `foxreach sequences update --campaign "$CID" --sequence <step id> --subject "..." --body "..."`, `foxreach campaigns resume "$CID"`. "Remove A/B Test" itself is not available in the public API. Two-campaign design: keep the winning setting for future campaigns; offer to pause the losing campaign.

## Step 9: Close out

On winner or a closed inconclusive: clear `.cold/experiments/.active`. If `experiments.autoAdvanceTier` is true, raise `currentTier` by 1. Append to `.cold/decisions.md`:

```markdown
## <date>: tier <N> / <variable>
Experiment: <id>
Outcome: <winner = arm | inconclusive>
Numbers: <rb>% vs <ra>% interested (<delta>pp, p=<p>, CI [<lo>, <hi>])
Status: <pending review | applied automatically, streak <s>>
Next: <next tier or extension>
```

## Constraints

- Never read before `min_days_before_read`.
- Never apply a diff while `trust.autoCommit` is false; write the patch.
- A bounce guard breach invalidates the experiment: pause, no cold.md change.
- One experiment at a time.

## Output

- `.cold/experiments/<id>/results.json`, `decision.md`
- `.cold/beliefs.md`, `.cold/decisions.md` (appended)
- `.cold/proposed-diff.patch` (winner, trust not yet earned)
- `.cold/trust.json`

## References

- A/B testing in FoxReach: https://www.foxreach.io/docs/product/ab-testing
- FoxReach CLI: https://www.foxreach.io/docs/sdks/cli
- Public API spec: https://api.foxreach.io/openapi-public.json
