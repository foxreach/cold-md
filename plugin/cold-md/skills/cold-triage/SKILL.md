---
name: cold-triage
description: Pull unread replies from the FoxReach inbox, sort each thread into a category, draft responses to interested replies from cold.md ## Objections, and send a reply only after the user approves it. Use when the user says "triage replies", "any new replies", "/cold triage", or on a daily schedule once a campaign is live.
---

# cold-triage

Keeps the inbox sorted and drafts responses to the replies worth answering. Reads from FoxReach, writes categories back, never sends on its own.

## When to use

- User asks "any new replies?" or runs `/cold triage [--campaign ID]`
- A daily schedule (for example `/schedule "0 9 * * *" "/cold triage"` in Claude Code)
- Any time after a campaign is live and replies are arriving

## Inputs

- `cold.md`: `## Objections` (reply patterns), `## Voice`, `## Banned`, `## Proof`
- `.cold/last-send.json`: current campaign id (used when `--campaign` is not given)
- `.cold/config.json`: `trust.humanApprovalRequired` (default true)
- `FOXREACH_API_KEY` (keys start with `otr_`; create one in the app under Settings > Integrations > API Keys)

## Categories

These are the only values `foxreach inbox update --category` accepts. The public API rejects anything else.

| Category | Meaning | What triage does |
|---|---|---|
| `interested` | Wants info, a call, pricing, a sample | Draft a response, surface to the user |
| `not_interested` | Clear no | Mark read |
| `out_of_office` | Auto-reply or away notice | Mark read, note the return date if one is given |
| `bounce` | Delivery failure | Mark read, no reply (FoxReach handles bounces) |
| `unsubscribe` | Asks to be removed | Confirm with the user first, then set. Setting it unsubscribes the lead |
| `uncategorized` | FoxReach could not decide | Re-read and pick one of the above |
| `unknown` | Needs a human | Surface to the user as-is |
| `unrelated` | Not about the campaign | Mark read; hidden from the inbox list by default |

`warmup` also exists as a category but it is warmup traffic, hidden from `inbox list` by default and not settable through the API. Skip it.

Side effects worth knowing:
- Moving a thread **away from** `out_of_office` to any other category stops that lead's active sequence, the same as a real reply would.
- Moving a thread **into** `out_of_office` never restarts a stopped sequence.
- `unsubscribe` unsubscribes the lead. This is why it needs a yes from the user.

## Process

### Step 1 - Pull unread threads

```bash
CAMPAIGN=${CAMPAIGN:-$(jq -r '.campaignId // empty' .cold/last-send.json 2>/dev/null)}
foxreach inbox list --unread ${CAMPAIGN:+--campaign "$CAMPAIGN"} --limit 100 --json > .cold/tmp-unread.json
jq '.data | length' .cold/tmp-unread.json
```

If `meta.total_pages` is greater than 1, repeat with `--page 2`, `--page 3`, and so on. If the count is 0, print "No unread replies." and stop.

The CLI prints snake_case keys. Each item has `id`, `from_email`, `subject`, `category`, `is_read`, `campaign_id`, `lead_id`, `received_at`. The list does not carry the body.

### Step 2 - Read each thread

```bash
foxreach inbox get REPLY_ID --json            # body, body_plain, category
foxreach inbox conversation REPLY_ID --json   # the whole back-and-forth, for context
```

Use `inbox get` for every thread and `inbox conversation` for anything you will draft a response to. Do not pass `--mark-read` here; the read flag is set in Step 4 together with the category.

### Step 3 - Decide the category

- Trust FoxReach's category when it is anything other than `uncategorized` or `unknown`, unless the body plainly contradicts it (for example an out-of-office notice that also says "yes, send it over").
- For `uncategorized` threads, classify the body against the table above and `cold.md ## Objections`. Produce `{replyId, category, reason}` with a one-sentence reason.
- Keep `unknown` for anything you would not bet on.

Print the plan before changing anything:

```
Triage plan (7 unread):
  interested      2   drafts will be written
  not_interested  2   mark read
  out_of_office   1   mark read (back 2026-11-10)
  uncategorized   1   -> interested (asks what it costs)
  unsubscribe     1   needs your OK: "please remove me" from jo@example.com
Apply? (y/n/edit)
```

When `trust.humanApprovalRequired` is true (the default), wait for `y`. `unsubscribe` always waits for an explicit yes, even when approval is otherwise off.

### Step 4 - Write categories back, one call per thread

There is no bulk update command. Loop:

```bash
foxreach inbox update REPLY_ID --category interested --read --json
foxreach inbox update REPLY_ID --category not_interested --read --json
foxreach inbox update REPLY_ID --read --json        # mark read, keep the category
```

If the user prefers to see `interested` and `unknown` threads in the FoxReach inbox as unread, set the category without `--read`.

Record every thread where you overrode FoxReach's category in `.cold/decisions.md` (date, reply id, old category, new category, reason).

### Step 5 - Draft responses to interested replies

For each `interested` thread:

1. Match the reply against `cold.md ## Objections` first (intent, not exact wording). If one matches, start from its preferred reply and edit only to reference what the person said.
2. If nothing matches, say so and draft fresh from `## Value` and `## Proof`.
3. Use per-lead research if it exists (`.cold/research/lead-personalization/<leadKey>.md`, keyed as in cold-research).
4. Obey `## Voice`, cite only `## Proof`, and run the `## Banned` check (case-insensitive). Regenerate up to 3 times, then stop and surface the conflict.
5. Save to `.cold/drafts/replies/<replyId>.md`. The body goes below the frontmatter and nothing else does, so the file can be sent as-is:

```markdown
---
replyId: <id>
leadEmail: <from_email>
category: interested
theirReply: "<one-line quote>"
objectionMatched: "<quoted objection, or none>"
proofCited: "<lines from ## Proof, or none>"
bannedCheck: pass
draftedAt: <ISO timestamp>
---
<drafted response body>
```

Never put a number, client name, link or price in a draft unless it is in `cold.md`.

### Step 6 - Send only on explicit approval

Show each draft and ask "send / edit / skip". On "send":

```bash
BODY=$(awk '/^---$/{n++; next} n>=2' .cold/drafts/replies/REPLY_ID.md)
foxreach inbox reply REPLY_ID --body "$BODY" --json
```

Add `--subject "..."` only if the user wants a different subject. FoxReach refuses to send to a lead who has unsubscribed; surface that error as-is. Move sent drafts to `.cold/drafts/replies/sent/`.

### Step 7 - Summary

```
Triage complete (7 unread -> 0)
  interested       3  (1 re-categorized)  drafts: .cold/drafts/replies/
  not_interested   2  marked read
  out_of_office    1  marked read
  unsubscribe      1  set after your OK
  replies sent     1  skipped 2
```

## Fallback contract

CLI first. If `foxreach` is missing, use curl against `$baseUrl/api/v1` (`baseUrl` from `.cold/config.json`, default `https://api.foxreach.io`). Curl responses use camelCase keys under `.data` (for example `bodyPreview`, `isRead`, `campaignId`).

```bash
H="X-API-Key: $FOXREACH_API_KEY"
curl -s -H "$H" "https://api.foxreach.io/api/v1/inbox/threads?isRead=false&pageSize=100"
curl -s -H "$H" "https://api.foxreach.io/api/v1/inbox/threads/REPLY_ID"
curl -s -H "$H" "https://api.foxreach.io/api/v1/inbox/threads/REPLY_ID/conversation"
curl -s -X PATCH -H "$H" -H "Content-Type: application/json" \
  -d '{"category":"interested","isRead":true}' \
  "https://api.foxreach.io/api/v1/inbox/threads/REPLY_ID"
curl -s -X POST -H "$H" -H "Content-Type: application/json" \
  -d '{"body":"..."}' "https://api.foxreach.io/api/v1/inbox/threads/REPLY_ID/reply"
```

If the CLI and curl both fail, read the docs pages below and tell the user exactly what failed.

## Constraints

- **Never auto-send.** A reply goes out only after the user says "send" for that draft.
- Never set `unsubscribe` without an explicit yes.
- Do not reply to `bounce`, `out_of_office`, `unrelated` or `warmup` threads.
- Respect `cold.md ## Banned` in every draft.
- Log category overrides to `.cold/decisions.md`.

## Output

- `.cold/drafts/replies/<replyId>.md`
- Updated FoxReach thread state (category, read flag)
- Replies sent only on approval

## References

- Spec: https://cold.md
- List threads: https://www.foxreach.io/docs/api-reference/inbox/list-threads
- Update a thread: https://www.foxreach.io/docs/api-reference/inbox/update-thread
- Send a reply: https://www.foxreach.io/docs/api-reference/inbox/send-reply
- CLI: https://www.foxreach.io/docs/sdks/cli
