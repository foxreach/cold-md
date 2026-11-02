---
name: cold-icp
description: Build your Ideal Customer Profile (ICP) and write it to icp.md for the rest of the cold.md suite to consume. Use when the user says "build my ICP", "define my target audience", "who should I sell to", "analyze my website for ICP", or when starting a new cold outreach project. Can bootstrap from a URL (scrape homepage, about, pricing, case studies) or run an interactive Q&A. Validates the draft with web research and, when a FoxReach key is set, an optional free Lead Finder count. Writes a structured icp.md that cold-leads, cold-draft, and cold-send all read.
---

# cold-icp

Step 1 of the cold.md suite. Builds the `icp.md` file that every other skill reads.

## When to use

- User says "build my ICP", "define my audience", "who should I sell to"
- User is starting a new cold outreach project and has no `icp.md` yet
- User wants to re-derive ICP from their website, case studies, or past wins
- User asks "does [lead] fit my ICP?"

## Two input modes

### Mode 1 - From a URL

If the user gives a URL (their company site, a case study library, or a portfolio):

1. Fetch the homepage, `/about`, `/pricing`, `/customers`, `/case-studies` (whichever exist).
2. Extract:
   - Industry / vertical (from hero copy, testimonial logos, case studies)
   - Typical customer size (SMB / mid-market / enterprise - infer from case study names + pricing tiers)
   - Geography (from team + testimonial locations)
   - Titles / roles mentioned in testimonials
   - Pain signals (the problems the company talks about solving)
   - Pricing tier (so we can rule out misaligned prospects later)
3. Draft the `icp.md` from the extracted data.
4. Surface any gaps ("I couldn't find your geography - is it US-only, global, EU-focused?") and fill via Q&A.

### Mode 2 - Interactive Q&A

If the user has no URL or wants to build from scratch, ask these 7 questions in order:

1. **Company size band** (employees): 1-10 / 11-50 / 51-200 / 201-1000 / 1000+
2. **Industry / vertical(s)**: list 1-3
3. **Stage / funding**: bootstrapped / seed / A-C / public / doesn't matter
4. **Titles you sell to**: list top 3
5. **Observable pain signals**: what does a prospect *do* or *not do* that signals they have this problem? (tool stack, job posts, public statements, GitHub commits, hiring patterns)
6. **Geography / language**: US, UK, EU, APAC, global, English-only, multilingual
7. **Hard disqualifiers**: who would you refuse to sell to even if they offered money? (list 2-5)

Each answer goes into the corresponding section of `icp.md`.

## Output format - `icp.md`

Write to `./icp.md` in the current directory (not `cold.md`). The cold.md suite uses two files: `icp.md` (who) and `cold.md` (voice/message). They are separate so you can iterate on either independently.

```markdown
---
coldMdVersion: "0"
updated: YYYY-MM-DD
source: [url or interactive]
---

# ICP - [Product or Company Name]

## Company signals

- Size: [X-Y employees]
- Stage: [funding / revenue band]
- Industry: [vertical 1], [vertical 2]
- Geography: [countries / regions]
- Tech stack signals: [tools they must use / must not use]

## Title signals

- Primary: [job title 1], [job title 2]
- Secondary: [job title 3]
- Not: [decision-makers who are wrong for us]

## Pain signals (observable)

- [Signal 1 - something public you can verify]
- [Signal 2 - tool they use, job posting, GitHub activity, etc.]
- [Signal 3]

## Disqualifiers

- [Hard no 1]
- [Hard no 2]

## Qualification checklist

A lead passes if:
- [ ] Matches company size band
- [ ] Title is in primary or secondary list
- [ ] At least one pain signal is observable
- [ ] Does NOT match any disqualifier
- [ ] Geography/language aligned

## Notes

[Any context, reasoning, edge cases]
```

## Web research validation

Read `.cold/config.json`. If `research.policyLevelEnabled` is `true` (default), run up to `research.maxQueriesPerInvocation` (default 5) WebSearch queries to validate the drafted ICP **before** writing it. The goal: catch a niche that is too narrow, titles that do not exist at scale, or disqualifiers that do not mean anything.

If `.cold/config.json` does not exist (the user skipped `/cold init`), skip this step; the skill still works without it.

### Queries to run

For each query, capture: query string, top 3 result titles + URLs, and one sentence on what it tells us.

1. **Cluster size: companies in the vertical**
   `<vertical> companies <region>` (e.g. `"B2B SaaS warmup tools US"`)
   Tells us: is the niche big enough? Fewer than 3 relevant results suggests it is too narrow.

2. **Title prevalence**
   `"<title>" jobs <vertical>` (e.g. `"Head of Demand Gen" jobs B2B SaaS`)
   Tells us: is this title common in this niche, or rare?

3. **Pain language in the wild**
   `"<vertical> <pain>" site:reddit.com`
   Surfaces real complaints; borrow the phrasing for the offer.

4. **Case study patterns**
   `case study <vertical> <pain>`
   Finds proof formats the user can cite.

5. **Disqualifier validation**
   `"<disqualifier-trait>" <vertical>`
   Confirms the disqualified segment exists and really is a poor fit.

### Optional: size check in FoxReach Lead Finder

Only when `FOXREACH_API_KEY` is set and the workspace has Lead Finder (paid plans). It is free: `count` returns a number and never spends reveal credits or search budget. Never run `search`, `reveal` or `add-to-leads` from this skill.

```bash
foxreach lead-finder filter-options --json        # valid filter keys and values
foxreach lead-finder count --json \
  --filters '{"jobTitles":["Head of Demand Generation"],"countries":["US"],"keywords":["B2B SaaS"]}'
```

Build the filters from the drafted `## Title signals` and `## Company signals`, using only keys `filter-options` lists (the API rejects unknown keys; reference: https://www.foxreach.io/docs/api-reference/lead-finder/overview). The response carries `total`. Report it as-is:

- `total` is 0: the ICP is empty as written; loosen the tightest filter and say which.
- `total` is very large for a narrow offer: the ICP is probably too loose; suggest one more qualifier.

If the command errors (no key, free plan, provider unavailable), skip it and say so in one line.

### Save findings

Write to `.cold/research/icp-validation-<YYYY-MM-DD>.md`:

```markdown
# ICP validation - <YYYY-MM-DD>

## Source
- ICP: ./icp.md
- Queries run: <n> of <max>
- Lead Finder count: <total, or "not run">

## Findings

### Cluster size: <vertical> companies
- Query: "..."
- Top results: ...
- Insight: ...

### Title prevalence: <title>
...

## Risks
- [Anything the research flagged: niche too narrow, title rare, etc.]

## Suggested icp.md edits
- [Concrete proposed changes; the user accepts or rejects]
```

### Surface to user

Print a short summary, one line per check, using only what the searches returned:

```
ICP validation (<n> queries):
  OK    Cluster size: <what the results showed>
  OK    Title "<title>": <what the results showed>
  OK    Pain language: "<phrase>" seen in <source>
  WARN  Disqualifier "<trait>": <why it may be too broad>
  OK    Lead Finder count: <total> people match

Apply suggested edits to icp.md? (Y/n/show)
```

If the user accepts: edit icp.md. If "show": print the diff. If no: leave icp.md as-is and keep the findings file.

## Validation

After writing `icp.md`:

1. Check each section is filled (not `[placeholder]`).
2. Verify Titles list has at least one entry.
3. Verify Pain signals contains at least 2 *observable* signals (not vibes).
4. Run the qualification checklist against 1 known good customer (ask the user) - it should pass. If it fails, the ICP is too tight.
5. Run against 1 known bad-fit prospect - it should fail. If it passes, the ICP is too loose.

## Gotchas

- **Observable != vague.** "They care about deliverability" is not observable. "They use Instantly or Smartlead" is.
- **Disqualifiers are sharper than qualifiers.** Sometimes you only know the ICP by knowing who it's *not*.
- **Don't ship `icp.md` without running the qualification checklist against real leads.** Garbage in, garbage out for every downstream skill.

## References

- Full cold.md suite: https://cold.md
- The separate `cold.md` file defines *how* you talk; this `icp.md` defines *who* you talk to.
- Example cold.md: https://github.com/foxreach/cold-md/blob/main/examples/foxreach.cold.md
