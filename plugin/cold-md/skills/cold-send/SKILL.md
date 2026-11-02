---
name: cold-send
description: Turn the imported leads and drafted copy into a live FoxReach campaign. Runs pre-flight checks (banned phrases, audience, duplicates, variables and spin syntax, verification coverage, account health and bounce guard), creates the campaign and its steps, adds accounts and leads, decides on provider matching, walks the user through adding the A/B variant in the app, then starts the campaign after approval. Use after /cold leads and /cold draft, when the user says "ship it", "send", "launch" or runs /cold send.
---

# cold-send

Creates the campaign in FoxReach as a draft, checks everything, and starts it only after the user approves.

## Inputs

- `.cold/last-import.json` (from `/cold leads`): `leadIds`, `preExistingLeadIds`, `customFields`, `verification`, `file`, `importId`
- Drafts from `/cold draft`: `.cold/drafts/<importId>/`, else the newest folder under `.cold/drafts/`
- `cold.md`: `## Sequence` (steps, delays), `## Banned`, `## Audience` (including any "Not for" lines)
- `.cold/experiments/.active` and its `protocol.md` (optional)
- `.cold/config.json`: `sending.timezone`, `sending.dailyLimit`, `sending.espMatching`, `guards.*`, `trust.humanApprovalRequired`. v0.2 config: use `timezone: "UTC"`, `dailyLimit: 50`, `espMatching: "auto"`, `minAccountHealth: 70`.
- `FOXREACH_API_KEY`

## Step templates

FoxReach sends one template per step to every lead, filling `{{variables}}` from lead data. Build one template per `## Sequence` step (subject, body, delay in days) from cold.md and the drafts. The control copy is the step itself.

Per-lead text that is not a variable (for example the research hook) must live on the lead as a custom field:

```bash
foxreach leads update <LEAD_ID> --custom hook="<the line>"
```

and appear in the template as `{{hook|<generic fallback>}}`.

## Pre-flight, part 1 (local, nothing created yet)

Stop on any failure, print what failed and how to fix it.

1. **Banned phrases.** Scan every subject and body (step templates, variant copy, drafts) against `cold.md ## Banned`. Any hit: stop, name the file and phrase, ask the user to rerun `/cold draft`.
2. **Variables and spin syntax.** Every `{{name}}` must be a standard variable (`firstName`, `lastName`, `fullName`, `email`, `company`, `title`, `phone`, `website`, `linkedin`, `senderName`, `senderEmail`, `signature`, or the snake_case forms) or a name in `last-import.json.customFields`. A missing value renders as empty text, so any variable that is blank for some lead in the import file needs a fallback (`{{firstName|there}}`). Spin blocks are `{option one|option two}`; check braces are balanced and not nested. FoxReach also rejects invalid spin syntax when the step is created.
3. **Audience.** Every lead in the import file has `fit_score >= threshold` from `last-import.json`. Leads matching a "Not for" line in `cold.md ## Audience` (title, company type, industry, region) are removed from the send list and listed.
4. **Duplicates.** Remove repeated emails in the list. For each ID in `preExistingLeadIds`:
   ```bash
   foxreach leads activity <LEAD_ID> --json
   ```
   Flag the lead if `activities` has an `email_sent` in the last 90 days or `campaigns` shows another active enrollment. Exclude flagged leads unless the user passes `--allow-duplicates`.
5. **Verification coverage.** The lead API does not expose per-lead verification status, so read `last-import.json.verification`. `by: "none"`: warn that `<n>` leads are unverified and suggest `/cold leads` with verification on. `unknown` above zero: warn that those addresses can bounce. Warnings do not block.

## Pre-flight, part 2 (accounts)

```bash
foxreach accounts list --json
```

Offer the accounts with `isActive: true` and no `lastError` (default: all of them, or the ones the user names). For each chosen account:

```bash
foxreach accounts health <ACCOUNT_ID> --json
```

- **Health.** `healthScore` below `guards.minAccountHealth`: drop the account. `healthScore` null (fewer than 20 warmup observations) or `minAccountHealth` null: warn, keep it.
- **Bounce guard.** 7-day bounce rate = `bounce7d.bounced / bounce7d.sent` (use `bounceRate` when `bounce7d.sent` is 0). Above `guards.bounceRateThreshold`: drop the account and suggest more warmup or a swap. Not overridable.
- **Domain auth.** Print every entry in `warnings` (SPF/DKIM/DMARC). Warnings do not block; https://www.foxreach.io/free-tools/spf-dkim-dmarc-checker helps fix them.

No account left: stop.

**Capacity.** Planned sends = leads x steps. Daily capacity = the smaller of `sending.dailyLimit` and the sum of the accounts' `dailyLimit`. Print the days the first step needs. The plan's monthly sending quota is not available in the public API; tell the user to check it in the web app if the volume is large.

## Create the campaign (draft)

```bash
foxreach campaigns create --name "<name>" --timezone "<sending.timezone>" \
  --daily-limit <sending.dailyLimit> --json
```

Name: `<experiment id>` when an experiment is active, else `<icp vertical> - <YYYY-MM-DD>`. Pass `--esp-matching` only when `sending.espMatching` is `true`; `"auto"` is decided below. Defaults when omitted: UTC, Mon-Fri, 9-17, 50 per day.

One step per `## Sequence` entry, in order (step numbers start at 1):

```bash
foxreach sequences create --campaign $CID --name "<step name>" --delay-days <d> \
  --subject "<control subject>" --body "<control body>" --json
```

Steps default to sending only if the lead has not replied. Then accounts and leads:

```bash
foxreach campaigns add-accounts $CID --account-ids <id1,id2,...>
```

`add-leads` takes a comma-separated list, so send at most 500 IDs per call:

```bash
jq -r '.leadIds[]' .cold/send-leads.json | split -l 500 - .cold/chunk-
for f in .cold/chunk-*; do
  foxreach campaigns add-leads $CID --lead-ids "$(paste -sd, "$f")"
done
rm .cold/chunk-*
```

(`.cold/send-leads.json` = the lead IDs left after pre-flight.)

## Provider matching

```bash
foxreach campaigns esp-mix $CID --json
```

Returns `enabled`, `senders` (`google, microsoft, other`), `leads` (per provider, plus `unresolved`), `totalLeads`, `resolvedPct`.

- `sending.espMatching: true`: already on. If all senders are on one provider, say it has nothing to match.
- `false`: leave it off.
- `"auto"`: turn it on when senders include both Google and Microsoft mailboxes AND leads include both Google and Microsoft recipients:
  ```bash
  foxreach campaigns update $CID --esp-matching
  ```
  Otherwise leave it off and say why (for example "all senders are Google, nothing to match"). A low `resolvedPct` means lookups are still running; that is fine.

## A/B variant (only when an experiment is active)

The public API reads variants but cannot create or edit them. Never claim a variant was created. The campaign is still a draft, which is required to add variants (an active campaign must be paused first).

1. Print, then wait for the user:
   ```
   Add variant B in FoxReach (the API cannot create variants):
   1. Open the campaign "<name>" in the app (https://www.foxreach.io), Sequences tab.
   2. On step <N>, click "Add A/B Test". Variant A is the control, Variant B is a copy to edit.
   3. Click the pencil (Edit step), open B, replace its subject and body with:
        Subject: <variant subject>
        Body:
        <variant body>
   4. Keep both weights at 1 (50/50), click "Save All Variants".
   Reply "done" when saved. Guide: https://www.foxreach.io/docs/product/ab-testing
   ```
2. On "done":
   ```bash
   foxreach sequences list --campaign $CID --json
   ```
   Step `<N>` must have `hasVariants: true` and two `variants` (`id, label, subject, body, weight`). Match the variant whose copy equals the control to `control`, the other to `variant`. Copy differs from what you printed, or `hasVariants` is false: show it and ask the user to fix it. Do not start until it matches, or the user chooses to send without the experiment (then leave `.active` untouched and note it in `.cold/decisions.md`).
3. Write into `.cold/experiments/<id>/protocol.md` frontmatter: `campaignId`, `step`, `variantIds: { control: <id>, variant: <id> }`, `variantLabels: { control: A, variant: B }`.

Two-campaign experiments (protocol `design: two-campaign`, for cadence or provider matching): create two campaigns that differ only in the tested setting, split the leads randomly in half, give both the same accounts, and record both `campaignIds` in the protocol. For an `esp-matching` experiment the protocol sets provider matching per campaign; skip the `"auto"` rule.

## Approval and start

Show the summary and ask. With `trust.humanApprovalRequired` (default true) never start without a yes.

```
Ready to start "<name>" (<CID>), draft
  Steps: <n> (<names>), leads: <n>, accounts: <n>
  Provider matching: <on|off> (<reason>)
  Experiment: <id> step <N>, A=<id> B=<id>   (or: none)
  Warnings: <list or none>
Start now? (y/N)
```

```bash
foxreach campaigns start $CID
```

With provider matching on, the campaign can sit in "waiting for recipient lookups" for up to 30 minutes before the first sends. That is normal; leads behind a security gateway are reported as `gateway`.

## Save state: `.cold/last-send.json`

```json
{
  "campaignId": "...",
  "campaignIds": ["..."],
  "experimentId": "<id or null>",
  "testStep": 1,
  "sequenceIds": ["..."],
  "variantIds": { "control": "...", "variant": "..." },
  "espMatching": false,
  "accountIds": ["..."],
  "leadCount": 0,
  "excluded": { "notFor": 0, "duplicates": 0 },
  "sentAt": "<ISO time of campaigns start>"
}
```

`sentAt` is the start time; `/cold learn` reads stats from it.

```
Live: "<name>" (<CID>)
  /cold triage    Categorize replies as they arrive (needed for accurate results)
  /cold status    Check progress
  /cold learn     Read the experiment after <minDaysBeforeRead> days
```

## Fallback (CLI, then curl, then docs)

1. Find the path in `.cold/docs-cache/foxreach-openapi.json`.
2. `curl https://api.foxreach.io/api/v1/<path> -H "X-API-Key: $FOXREACH_API_KEY"` (for example `POST /campaigns/{id}/sequences` with `subject, body, name, delayDays, delayHours, sendOnlyIfNoReply, sendAsHtml`).
3. Docs: https://www.foxreach.io/docs/api-reference/campaigns/create-campaign and siblings.
4. Still failing: print what was tried and stop. Never guess an endpoint.

## Constraints

- Every pre-flight check runs. There is no `--skip-preflight`; the bounce guard cannot be overridden.
- Steps and variants cannot change while the campaign is active ("Pause it first").
- Never start without approval while `trust.humanApprovalRequired` is true.

## References

- FoxReach CLI: https://www.foxreach.io/docs/sdks/cli
- A/B testing: https://www.foxreach.io/docs/product/ab-testing
