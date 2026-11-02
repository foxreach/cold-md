---
name: cold-report
description: Write a digest of cold outreach performance from live FoxReach data (sends, replies by category, bounce and account health, warmup inbox placement, provider matching, credits left, experiment outcomes), or run a local deliverability audit of a sending domain. Use when the user asks for a report, digest, weekly recap, "how did my campaigns do", runs `/cold report [daily|weekly]` or `/cold audit <domain>`, or from a scheduled run.
---

# cold-report

Two jobs: the **digest** (`/cold report`) and the **domain audit** (`/cold audit <domain>`). Both read only; neither changes anything in FoxReach.

## Prerequisites

- `FOXREACH_API_KEY` (starts with `otr_`). If missing for a digest, stop with: "cold-report needs a FoxReach API key. Sign in at https://www.foxreach.io, create one under Settings > API Keys, then `export FOXREACH_API_KEY=otr_...`". The audit's DNS part runs without a key.
- `foxreach` CLI (`pip install foxreach-cli`), or curl as a fallback.
- `.cold/config.json` for `guards` (defaults if missing or v0.2: `bounceRateThreshold` 0.05, `notInterestedRateThreshold` 0.30, `minAccountHealth` 70).

The CLI prints snake_case keys. Curl returns camelCase keys under `.data`. Field names below are CLI first, curl in brackets.

## Digest

### Window

Daily = last 24 hours, weekly = last 7 days. Compute `FROM`/`TO` as ISO 8601 UTC. Only `inbox categorize-stats` is windowed; every other source is a current total or snapshot. Label each section accordingly, never present a lifetime total as "this week".

### Data sources

| Section | Command | Fields used |
|---|---|---|
| Workspace | `foxreach analytics overview --json` | `active_campaigns`, `active_accounts`, `total_sent`, `total_replies`, `reply_rate` (percent), `account_health_avg` [`activeCampaigns`, `activeAccounts`, `totalSent`, `totalReplies`, `replyRate`, `accountHealthAvg`] |
| Campaigns | `foxreach campaigns list --status active --json` then `foxreach analytics campaign ID --json` per campaign | list: `id`, `name`, `esp_matching`; stats: `sent`, `delivered`, `bounced`, `replied`, `opened`, `reply_rate`, `bounce_rate` (both percent) [`replyRate`, `bounceRate`] |
| Window activity | `foxreach inbox categorize-stats --group-by day --from $FROM --to $TO --json` (add `--campaign ID` per campaign) | `groups[]`: `key` (date), `sent`, `replied`, `interested`, `not_interested`, `out_of_office`, `bounce`, `unsubscribe`, `uncategorized` |
| Inbox now | `foxreach inbox stats --json` | `unread`, `uncategorized`, `unknown`, `interested`, `not_interested`, `out_of_office`, `bounce`, `unsubscribe` [`notInterested`, `outOfOffice`] |
| Warmup | `foxreach warmup stats --json` | `average_health_score`, `health_measured_accounts`, `active_warmup_accounts` [`averageHealthScore`, `healthMeasuredAccounts`, `activeWarmupAccounts`] |
| Accounts | `foxreach accounts list --limit 100 --json` | `data[]`: `id`, `email`, `health_score`, `connection_status`, `is_active`, `warmup_enabled`, `bounce_rate` |
| Account detail | `foxreach accounts health ID --json` for each account below `guards.minAccountHealth` or with a null score | `health_score`, `health_basis`, `bounce_7d`, `warmup_progress` (curl adds `connectionStatus`, `lastError`, `domainAuth`, `warnings`) |
| Provider matching | `foxreach campaigns esp-mix ID --json` for campaigns with `esp_matching: true` | `enabled`, `senders` (google, microsoft, other), `leads` (google, microsoft, other, unresolved), `total_leads`, `resolved_pct` |
| Credits | `foxreach verification credits --json`; `foxreach lead-finder credits --json` | verification: `balance`, `expires_at`; Lead Finder: `balance`, `monthly_included`, `expires_at` |

What the numbers mean:
- `average_health_score` and an account's `health_score` are the share of that mailbox's warmup mail that landed in the inbox over the last 7 days. A score is `null` below 20 warmup observations: report it as "not measured yet" (a warning, never a failure, never 0).
- `opened` depends on open tracking and image loading; show it last and label it as a soft signal.
- Lead Finder credits exist on paid workspaces only. If the command errors, leave the line out instead of printing 0.

Run the calls in parallel where the shell allows. If a call fails, say which one in the digest and carry on with the rest.

### Action items (derived, in this order)

- Campaign `bounce_rate / 100 > guards.bounceRateThreshold` -> "Pause <campaign> and check the list: bounce rate X%". This skill never pauses anything; offer `foxreach campaigns pause ID` and run it only on a yes.
- Window `not_interested / replied > guards.notInterestedRateThreshold` (only when `replied >= 10`) -> "Message is landing badly with <campaign>; consider `/cold experiment` on the opener."
- Account `health_score < minAccountHealth` -> "<email> inbox placement X%: keep warmup on and lower its daily limit." Null score -> "<email> not measured yet (under 20 warmup observations)."
- Account `connection_status` not `connected` -> "Reconnect <email> in FoxReach."
- `unread + uncategorized` > 0 -> "Run `/cold triage` (N waiting)."
- Provider matching on and all senders on one provider -> "Provider matching has nothing to match: all mailboxes are <provider>." `resolved_pct` under 100 -> "N% of leads still waiting for a provider lookup."
- Verification `balance` lower than the leads waiting to be imported (from `.cold/last-import.json` if present) -> "Top up verification credits before the next import."

### Template

```
COLD.MD REPORT - weekly (2026-10-27 to 2026-11-03, UTC)

THIS WINDOW (categorize-stats)
  Sent:            {sent}
  Replied:         {replied}  ({pct}% of sent)
  Interested:      {n}   Not interested: {n}   OOO: {n}
  Bounced:         {n}   Unsubscribed:   {n}   Uncategorized: {n}

ACTIVE CAMPAIGNS (lifetime)
  {name}  sent {sent}  reply {reply_rate}%  bounce {bounce_rate}% {WARN if over guard}
          provider matching: on, {resolved_pct}% of leads resolved

DELIVERABILITY (now)
  Warmup inbox placement (avg): {average_health_score}% across {health_measured_accounts} mailboxes
  Below {minAccountHealth}: {email} {score}% | not measured: {email}

INBOX (now)
  Unread: {unread}   Uncategorized: {uncategorized}

CREDITS LEFT
  Verification: {balance}   Lead Finder: {balance} of {monthly_included}/mo

EXPERIMENTS
  (see below)

ACTIONS
  - ...
```

Output modes: `terminal` (default), `markdown` (write `.cold/reports/YYYY-MM-DD.md`), `slack` (post the text to `$SLACK_WEBHOOK_URL` with `curl -X POST -H 'Content-Type: application/json' -d "$(jq -n --arg t "$TEXT" '{text:$t}')" "$SLACK_WEBHOOK_URL"`). In terminal mode, color headers and warnings only when stdout is a TTY and `NO_COLOR` is unset.

### Experiment outcomes

If `.cold/decisions.md` exists, append an "Experiments" section covering every decision since the last report (timestamp in `.cold/last-report.json`). For each concluded experiment:

```
Tier <N> / <variable>
- Experiment: <id>
- Outcome: winner = <arm> | inconclusive
- Numbers: <arm_a> <rate>% vs <arm_b> <rate>% interested-reply rate
- Confidence: <CI and p-value as recorded by cold-learn>
- Status: applied via diff | pending review | rejected
- Belief now locked: <one sentence>
```

Copy numbers from the experiment's `decision.md`; never recompute or round them differently. If a diff is pending, surface it at the top:

```
ACTION NEEDED: cold.md diff awaiting review since <date>
  .cold/proposed-diff.patch - accept with `git apply`, reject with `rm`
```

If an experiment is in flight, add "Currently testing: <variable>, <n> of <minDaysBeforeRead> days". Then write `.cold/last-report.json`: `{ "lastReportAt": "<ISO>", "type": "daily|weekly" }`.

### Scheduling

- Claude Code: `/schedule "0 9 * * *" "/cold report daily"` or `/schedule "0 9 * * 1" "/cold report weekly"`.
- Local cron: `0 9 * * 1 cd /path/to/project && claude -p "/cold report weekly --slack"`.
- FoxReach itself can email a weekly digest of campaign performance and replies: in the app, account settings > Notifications > Weekly Digest. Email only.
- Real-time events instead of a digest: `foxreach webhooks events` lists the types (including `reply.received`, `reply.categorized`, `email.bounced`, `campaign.paused`); `foxreach webhooks create --url <your endpoint> --events reply.received,email.bounced`. Point it at n8n, Make or your own endpoint and forward to Slack from there; deliveries are JSON `{id, type, payload, timestamp}`, not Slack message format. Guide: https://www.foxreach.io/docs/product/api-keys-and-webhooks

## Audit: `/cold audit <domain>`

Local, free, read-only. No paid steps.

### 1. DNS (no key needed)

```bash
D=example.com
dig +short MX "$D"
dig +short TXT "$D" | grep -i 'v=spf1'
dig +short TXT "_dmarc.$D"
for s in google selector1 selector2 default k1; do
  r=$(dig +short TXT "$s._domainkey.$D"); [ -n "$r" ] && echo "$s: $r"
done
```

If `dig` is missing, try `nslookup -type=TXT` or `host -t TXT`. Grade each record the way FoxReach's own account check does:

| Record | Pass | Warn | Fail |
|---|---|---|---|
| MX | at least one host | | none (replies and bounces have nowhere to go) |
| SPF | exactly one `v=spf1` ending `~all` or `-all` | ends `+all`, bare `all` or `?all`; Google sender without `_spf.google.com`; Microsoft sender without `spf.protection.outlook.com` | none, or more than one record |
| DKIM | a key (`p=` not empty) at any selector tried | | no key at the selectors tried (say which; the domain may use another selector), or `p=` empty (revoked) |
| DMARC | one record with `p=quarantine` or `p=reject` | `p=none` | none, more than one, or no valid `p=` |

Report DNS timeouts as "unknown", not as a fail.

### 2. FoxReach accounts on that domain (only when `FOXREACH_API_KEY` is set)

```bash
foxreach accounts list --limit 100 --json | jq -r --arg d "$D" '.data[] | select(.email | endswith("@" + $d)) | .id'
foxreach accounts health ACCOUNT_ID --json
foxreach tracking-domains list --json
```

For each matching account show `health_score` (or "not measured yet"), `bounce_7d` and `warmup_progress`. The CLI health output omits FoxReach's stored SPF/DKIM/DMARC result; to show it, use curl: `curl -s -H "X-API-Key: $FOXREACH_API_KEY" https://api.foxreach.io/api/v1/email-accounts/ACCOUNT_ID/health | jq '.data | {domainAuth, warnings, connectionStatus, lastError}'`. From `tracking-domains list` show each entry of `domains[]` with its `status`; if the list is empty, say tracking runs on the default domain (`default_domain`).

### 3. Output

```
AUDIT example.com
  MX     pass  aspmx.l.google.com
  SPF    warn  v=spf1 include:_spf.google.com ?all  (use ~all or -all)
  DKIM   pass  selector google
  DMARC  fail  no record at _dmarc.example.com
  FoxReach: 2 mailboxes, inbox placement 91% / not measured yet
  Tracking domain: none (default domain)
Free checkers for a second opinion:
  https://www.foxreach.io/free-tools/spf-dkim-dmarc-checker
  https://www.foxreach.io/free-tools/email-blacklist-checker
```

Blacklist status is not checked locally; point to the blacklist checker above.

## Fallback contract

CLI first, then curl with `-H "X-API-Key: $FOXREACH_API_KEY"` against `https://api.foxreach.io/api/v1`: `/analytics/overview`, `/analytics/campaigns/ID`, `/inbox/stats`, `/inbox/categorize-stats?groupBy=day&fromDate=...&toDate=...`, `/warmup/stats`, `/email-accounts`, `/email-accounts/ID/health`, `/campaigns?status=active`, `/campaigns/ID/esp-mix`, `/verification/credits`, `/lead-finder/credits`, `/tracking-domains`. Then the docs.

## Guardrails

- **Never fabricate metrics.** Report only what a call returned; name any call that failed.
- Rates from the API are already percentages; do not multiply again. Bounce to one decimal, the rest to whole numbers.
- Put the time zone (UTC unless the user's `$TZ` is set) in the header.

## References

- Analytics: https://www.foxreach.io/docs/api-reference/analytics/overview
- Categorize stats: https://www.foxreach.io/docs/api-reference/inbox/categorize-stats
- Warmup: https://www.foxreach.io/docs/api-reference/warmup/overview
- CLI: https://www.foxreach.io/docs/sdks/cli
- Spec: https://cold.md
