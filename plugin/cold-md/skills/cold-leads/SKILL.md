---
name: cold-leads
description: Build the lead list for the next campaign. Sources leads from a CSV or from FoxReach Lead Finder, scores every lead against icp.md, verifies emails, imports the survivors into FoxReach and records their lead IDs in .cold/last-import.json for /cold send. Use when the user says "import leads", "find leads", "score these prospects", "filter to my ICP" or runs /cold leads.
---

# cold-leads

Turns `icp.md` into a scored, verified list of FoxReach leads. It does not create a campaign; `/cold send` does that from `.cold/last-import.json`.

## Inputs

- `./icp.md` (required; run `/cold icp` first)
- `.cold/config.json`: `leads.source`, `leads.verifyBeforeSend`, `leads.dropQualities`, `personalization.*`. A v0.2 config without `leads` falls back to `source: "csv"`, `verifyBeforeSend: true`, `dropQualities: ["bad"]`; suggest `/cold init --upgrade` once.
- Arguments (override config):
  - `--csv <path>`: use a CSV (needs an `email` column; `firstName, lastName, company, title, linkedinUrl, website` recommended)
  - `--finder`: use FoxReach Lead Finder
  - `--count N`: how many leads to aim for (Lead Finder). Default: `2 x experiments.minSamplePerVariant`, enough for one A/B.
  - `--threshold 0.5`: minimum ICP fit score
- `FOXREACH_API_KEY` (`otr_...`) or a key saved with `foxreach config set-key`. Missing: stop and point to Settings > Integrations > API Keys in the app (https://www.foxreach.io).

Source = `--csv` / `--finder` if given, else `leads.source`.

## Scoring (both sources)

Score in batches of 20 leads per call:

```
Given this ICP:
<icp.md>

And these leads:
<rows as JSON>

Output strictly, one per lead:
{ "email_or_id": "...", "fit": 0.0-1.0, "reason": "<one sentence>" }
```

Drop every lead below the threshold. Never push a below-threshold lead; it burns credits and sender reputation.

## Source A: CSV

1. Validate: `icp.md` exists, the CSV has an `email` column. Remove in-file duplicate emails (keep the first).
2. Score. Write the full scored file to `.cold/scored-leads-<YYYY-MM-DD>.csv` (adds `fit_score`, `fit_reason`) and the survivors to `.cold/import.csv`.
3. Optional per-lead research (only when `personalization.perLead` is true), see below.
4. Verify (when `leads.verifyBeforeSend` is true), see below.
5. Import, see below.

## Source B: FoxReach Lead Finder

Paid workspaces only. A plan error from any Lead Finder call means the workspace is not on a paid plan: say so and offer the CSV route.

1. **Budget.** `foxreach lead-finder credits --json`. Show `balance` (reveal credits) and `searchPagesUsedToday` / `searchPagesAllowedToday` (each search page counts against the daily budget; counts do not).
2. **Filters.** `foxreach lead-finder filter-options --json` returns the valid filter keys and values. Translate `icp.md` (titles, seniority, industries, company size, countries) into a filter object using only keys and values from that output; check https://www.foxreach.io/docs/api-reference/lead-finder/get-filter-options and https://www.foxreach.io/docs/api-reference/lead-finder/search-people when a key's shape is unclear. Never guess a key. Save to `.cold/lead-finder-filters.json` and show it.
3. **Count first (free).**
   ```bash
   foxreach lead-finder count --filters "$(cat .cold/lead-finder-filters.json)" --json
   ```
   Show `total`. Zero or far more than needed: tighten or loosen the filters with the user before searching.
4. **Search.**
   ```bash
   foxreach lead-finder search --filters "$(cat .cold/lead-finder-filters.json)" --page-size 50 --json
   ```
   Page with `--page-token <nextPageToken>` until you hold about 2x `--count` candidates or the budget runs out (a 429 with `lead_finder_search_cap` means today's searches are used up; stop and work with what you have). Each person has `id, firstName, lastName, title, company, companyDomain, linkedinUrl, location, industry, companySize, revealStatus, inLeads, leadId`. Skip people with `inLeads: true` unless the user wants them.
5. **Score** the people against `icp.md`, drop below threshold, keep the top `--count`.
6. **Confirm the spend.** One reveal credit is charged per person whose email is found. Nothing is charged when no email is found or the address is already a lead, and people with `revealStatus: "found"` are reused at no charge. Print:
   ```
   Reveal <n> people? Up to <n - already found> reveal credits (balance <balance>). (y/N)
   ```
   Do not reveal without an explicit yes.
7. **Reveal** in batches of at most 100 people. Send the full person snapshots from the search results:
   ```bash
   curl -sS -X POST "https://api.foxreach.io/api/v1/lead-finder/reveal" \
     -H "X-API-Key: $FOXREACH_API_KEY" -H "Content-Type: application/json" \
     -d @.cold/reveal-batch-1.json
   # body: {"people":[{"id":"...","firstName":"...","lastName":"...","title":"...","company":"...","companyDomain":"...","linkedinUrl":"..."}]}
   ```
   Use this call rather than `foxreach lead-finder reveal --person-ids`: that CLI command sends only the person ID, and the API needs a name plus a company or domain to look up an email, so those people come back as `unsearchable`. The response has `batchId, requested, charged, reused, inProgress, unsearchable, balance`.
8. **Poll** each batch until `pending` is 0 (every 15 seconds; after 10 minutes stop and tell the user to rerun later):
   ```bash
   foxreach lead-finder reveals-get <batchId> --json
   ```
   Each row: `id` (the reveal ID), `status`, `email`, `certainty`, `leadId`, `inLeads`. Totals: `found, notFound, errors, balance`.
9. **Add to leads.** Revealing never creates leads; this does:
   ```bash
   foxreach lead-finder add-to-leads --reveal-ids <found reveal ids, comma-separated> --json
   ```
   Returns `added, restored, alreadyInLeads, skipped`. Run `reveals-get` once more to read the `leadId` of every found reveal.
10. Write `.cold/import.csv` from the found reveals (`email, firstName, lastName, company, title, linkedinUrl`, `website` from `companyDomain`, `fit_score, fit_reason`) so `/cold draft` reads the same file for both sources.

Revealed emails are already verified by Lead Finder. Do not run them through `verification verify-bulk` again.

## Per-lead research (optional)

Only when `personalization.perLead` is true. Budget `personalization.perLeadBudget` (default 2 searches per lead):

1. `"<firstName> <lastName>" "<company>"` (recent activity)
2. `"<company>" hire OR launch OR funding <current year>` (company news)

Cache to `.cold/research/lead-personalization/<leadKey>.md` (`leadKey` = the lead's CSV `id`, else the first 12 hex characters of `sha256(lowercase(trim(email)))`, same as cold-research) with the signals (each with its source URL) and a one-line suggested hook. No useful result: write "no signal". Never block the import on research. If hooks exist, add a `hook` column to `.cold/import.csv` so it is imported as a custom field.

## Verification (CSV source)

Skip when `leads.verifyBeforeSend` is false, and say that leads will go out unverified.

```bash
foxreach verification credits --json        # balance
```

Only `good` and `bad` verdicts are charged, so the row count is an upper bound on the cost. If `balance` is below the row count, show both numbers and ask whether to verify part of the list, skip verification, or stop.

```bash
foxreach verification verify-bulk --input .cold/import.csv --output .cold/verified.csv \
  --drop "$(jq -r '.leads.dropQualities // ["bad"] | join(",")' .cold/config.json)"
```

Add `--email-column <name>` if the column is not `email`. The output gains `verification_quality`, `verification_result`, `verification_did_you_mean`. Report counts of good / unknown / error from the output and the dropped count from the command's summary line. Rows with an empty quality could not be checked (invalid format): drop them. Import `.cold/verified.csv` instead of `.cold/import.csv`.

## Import (CSV source)

Build the mapping from the CSV header. Standard targets: `email, first_name, last_name, company, title, phone, linkedin_url, website, notes`. Every other column you want available as a `{{variable}}` (for example `hook`, `fit_score`) maps to `custom:<name>`. Use single-word or camelCase custom names: the CLI camel-cases snake_case keys.

```bash
foxreach leads import --file .cold/verified.csv --json --mapping \
  '{"email":"email","firstName":"first_name","lastName":"last_name","company":"company","title":"title","linkedinUrl":"linkedin_url","website":"website","hook":"custom:hook","fit_score":"custom:icpFit"}'
```

The API accepts at most 1000 leads per request, so split larger files into parts of 1000 rows and import each. The result is `created, restored, duplicates, errors`; it does not return lead IDs.

**Resolve lead IDs.** For each imported email:

```bash
foxreach leads list --email "<email>" --json
```

Take the single match's `id`, `status` and `createdAt`. Drop leads whose status is `bounced` or `unsubscribed` from the list you hand to `/cold send` and report them. A lead created before this run started already existed in the workspace: record it under `preExistingLeadIds` so `/cold send` can check its history.

## Provider split

```bash
foxreach leads providers --json
```

Shows how the workspace's leads split by recipient mail provider (`google, microsoft, zoho, yahoo, godaddy, other, gateway, unresolved`). `gateway` means the domain sits behind a security gateway; `unresolved` means the lookup has not run yet and fills in after import. `/cold send` uses this split to decide on provider matching.

## Save state: `.cold/last-import.json`

`/cold send` reads this file. Keep the field names.

```json
{
  "importId": "2026-11-03-csv",
  "source": "csv",
  "importedAt": "2026-11-03T10:12:00Z",
  "file": ".cold/verified.csv",
  "threshold": 0.5,
  "scored": 0,
  "imported": 0,
  "droppedBelowFit": 0,
  "verification": { "by": "verify-bulk", "good": 0, "unknown": 0, "error": 0, "dropped": 0 },
  "import": { "created": 0, "restored": 0, "duplicates": 0, "errors": 0 },
  "leadIds": ["..."],
  "preExistingLeadIds": ["..."],
  "droppedStatus": { "bounced": 0, "unsubscribed": 0 },
  "customFields": ["hook", "icpFit"],
  "providers": { "google": 0, "microsoft": 0, "other": 0, "unresolved": 0 },
  "personalization": "disabled"
}
```

`verification.by` is `"verify-bulk"`, `"lead-finder"` (reveals) or `"none"`. For Lead Finder, also store `"revealBatchIds"` and `"creditsCharged"`. Fill every count from real command output; never estimate.

## Summary

```
Leads ready: <n> (source <csv|lead-finder>)
  Scored <n>, dropped <n> below fit <threshold>
  Verification: <good> good, <unknown> unknown, <dropped> dropped (<by>)
  Import: <created> created, <restored> restored, <duplicates> already in workspace
  Providers: <google> Google, <microsoft> Microsoft, <other> other, <unresolved> not looked up yet

Next:
  /cold experiment    Design the A/B
  /cold draft         Write control and variant copy
  /cold send          Pre-flight, create the campaign, start
```

## Fallback (CLI, then curl, then docs)

1. Look up the endpoint in `.cold/docs-cache/foxreach-openapi.json` (from https://api.foxreach.io/openapi-public.json).
2. Call it with curl: `https://api.foxreach.io/api/v1/<path>` and `-H "X-API-Key: $FOXREACH_API_KEY"`.
3. Read the matching API page, pattern `https://www.foxreach.io/docs/api-reference/<group>/<page>` (for example `.../campaigns/create-campaign`).
4. Still failing: print what was tried and stop. Never guess an endpoint.

## Constraints

- Never reveal without explicit confirmation of the credit cost.
- Never import a lead below the fit threshold or with a dropped verification quality.
- Per-lead research is off unless the user opted in.
- No third-party enrichment providers unless the user adds one.

## References

- FoxReach CLI: https://www.foxreach.io/docs/sdks/cli
- Email verification: https://www.foxreach.io/docs/get-started/verify-emails
- Reveal emails (API): https://www.foxreach.io/docs/api-reference/lead-finder/reveal-emails
- API authentication: https://www.foxreach.io/docs/authentication
