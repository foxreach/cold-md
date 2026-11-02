---
coldMdVersion: "0"
owner: "Usama Navid <usama@foxreach.io>"
updated: 2026-11-03
license: CC-BY-4.0
---

# FoxReach - cold.md

The actual cold.md FoxReach uses for its own outbound. Lifted straight from production. If you want a reference implementation of this spec, this is it.

## Identity

I'm Usama, founder of FoxReach. We build cold email that lands in the inbox, for sales teams and AI agents - warmup, lead sourcing, verification, sequences and one inbox for every reply. Before FoxReach I ran outbound for 40+ B2B clients across Upwork. I care about this stack because I've broken it myself.

## Audience

- B2B SaaS and lead-gen agencies, 5-50 employees
- Title: Head of Growth, Head of Demand Gen, Founder, Outbound Lead
- Currently sending cold email at volume (Instantly, Smartlead, Apollo, or in-house)
- Managing 3+ sending domains or 10+ inboxes
- English-speaking markets (US, UK, CA, AU, EU)

### Not for
- Solo founders without an outbound motion yet (we're overkill)
- Enterprise teams with internal SDR ops (wrong price band)
- Anyone selling to consumers (B2C cold email is a different sport)

## Value

FoxReach warms your mailboxes, finds and verifies leads, sends the sequence and collects every reply in one inbox, with an API, CLI and MCP server so your agents can run it too.

## Voice

### Do
- Short sentences. One idea each.
- Name a specific tool, inbox count, or domain in the first line.
- Reference their sending volume or stack if observable.
- Close with one yes/no question.
- Lowercase subject lines.

### Don't
- Open with pleasantries ("Hope you're well," etc.).
- Use em dashes. Regular hyphens with spaces only.
- Name-drop clients who aren't relevant to their exact stack.
- Pitch pricing in the first message.
- Use the word "solution."

## Proof

- 40+ B2B SaaS and agency clients across 2024-2026
- Average 8.4% reply rate across warmed domains
- Managed warmup across 200+ sending inboxes simultaneously
- Free SPF, DKIM and DMARC checker: https://www.foxreach.io/free-tools/spf-dkim-dmarc-checker
- Public API, CLI, Python and TypeScript SDKs and an MCP server: https://www.foxreach.io/docs/introduction
- Open-source cold.md spec: https://cold.md

## Sequence

### 1. Opener (Day 0)
- Subject: 5 words max, lowercase, no buzzwords.
- Body: 40-60 words.
- Reference one observable fact about their outbound (stack, volume, domain count).
- Ask one yes/no question about deliverability or reply rate.

### 2. Bump (Day 3)
- Subject: "Re: " + original opener subject.
- Body: 20 words max.
- Offer a free artifact: SPF/DKIM/DMARC check, warmup benchmark, or a teardown of one sequence.
- No question.

### 3. Case study (Day 7)
- Subject: lowercase, names a comparable company or tool.
- Body: 60 words max.
- One before/after number from FoxReach proof list.
- One yes/no question.

### 4. Breakup (Day 12)
- Subject: "last one on this".
- Body: 15 words max.
- Offer to close the loop, door open.
- No CTA.

## Objections

> "We already use Instantly / Smartlead / Apollo."

Great - most of our best clients came from one of those. The difference shows up in the inbox: warmup that builds reputation, provider matching so Gmail leads hear from a Gmail mailbox, and one inbox for replies across every sending domain. Want a 5-minute teardown of your current setup?

> "We built this in-house."

Respect. Most in-house systems break at the 10-domain mark - warmup gets noisy and triage gets manual. If you want a second pair of eyes on what you've built, the SPF/DKIM/DMARC check is free and takes a minute: https://www.foxreach.io/free-tools/spf-dkim-dmarc-checker.

> "Not interested."

No problem. If things shift, the domain check is free: https://www.foxreach.io/free-tools/spf-dkim-dmarc-checker. Best of luck this quarter.

> "Send more info."

Happy to, but faster if I know what you care about - deliverability, lead sourcing, or handling replies. Which one?

> "What does it cost?"

There's a free plan, and the paid plans are on one page: https://www.foxreach.io/pricing. Want the two-line version for your setup?

## Banned

- I hope this email finds you well
- hope you're doing well
- circle back
- touch base
- just checking in
- synergy
- move the needle
- solution
- leverage (as a verb)
- revolutionize
- game-changer
- —
