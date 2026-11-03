'use client'

import { useState } from 'react'

// Example files for a made-up company on a reserved domain (.example), so no
// real business is implied. cold.md shows all eight spec sections in order.
const COLD_MD = `---
coldMdVersion: "0"
owner: "Dana Reyes <dana@northwind.example>"
---

# Northwind - cold.md

## Identity
I'm Dana, founder of Northwind. We turn product analytics
into a weekly plan your growth team can act on.

## Audience
- B2B SaaS, 20-200 employees, Series A or B
- Title: Head of Growth, VP Product, Founder
### Not for
- Agencies, consultancies

## Value
Northwind tells your growth team what to ship next week,
from the data you already collect.

## Voice
### Do
- Short sentences. One idea each.
- Close with one yes/no question.
### Don't
- Use em dashes.

## Proof
- Reads the events you already send, no new tracking
- Case study: https://northwind.example/customers

## Sequence
### 1. Opener (Day 0)
- Subject: a question about their stack, 6 words max
- Body: 40-60 words, one observable fact
### 2. Bump (Day 3)
- Body: 20 words max, one new piece of value

## Objections
> "We already have a BI tool."
Good, Northwind reads the same data and says what to ship.
Want a 15-minute look at one of your weeks?

## Banned
- I hope this email finds you well
- circle back`

const ICP_MD = `---
coldMdVersion: "0"
source: /cold icp https://northwind.example
---

# ICP - Northwind

## Company signals
- B2B SaaS, 20-200 employees
- Raised a Series A or B in the last 18 months
- Self-serve signup on the website

## Title signals
- Head of Growth, VP Product, Founder

## Pain signals (observable)
- Hiring a growth or data analyst
- Public changelog with weekly releases

## Disqualifiers
- Agencies, consultancies
- Fewer than 10 employees

## Qualification checklist
- [ ] Company signal matches
- [ ] Title matches
- [ ] At least one pain signal`

const FILES = [
  { name: 'cold.md', body: COLD_MD },
  { name: 'icp.md', body: ICP_MD },
] as const

function tone(line: string) {
  if (line.startsWith('## ')) return 'font-medium text-fox'
  if (line.startsWith('# ') || line.startsWith('### ')) return 'font-medium text-ink'
  if (line.startsWith('> ')) return 'italic text-ink-2'
  if (line === '---' || /^\w+:/.test(line)) return 'text-ink-4'
  return 'text-ink-2'
}

export default function FileTabs() {
  const [active, setActive] = useState(0)
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white shadow-lift">
      <div className="flex items-end gap-1 border-b border-line bg-panel px-3 pt-2 text-[12.5px]" role="tablist" aria-label="Example files">
        {FILES.map((f, i) => (
          <button
            key={f.name}
            type="button"
            role="tab"
            id={`tab-${f.name}`}
            aria-selected={active === i}
            aria-controls={`panel-${f.name}`}
            onClick={() => setActive(i)}
            className={`-mb-px rounded-t-md border px-3 py-1.5 font-mono transition-colors ${
              active === i ? 'border-line border-b-white bg-white text-ink' : 'border-transparent text-ink-3 hover:text-ink'
            }`}
          >
            {f.name}
          </button>
        ))}
        <span className="ml-auto pb-2 pr-1 text-[11px] uppercase tracking-wider text-ink-4">example</span>
      </div>
      {FILES.map((f, i) => (
        <div key={f.name} id={`panel-${f.name}`} role="tabpanel" aria-labelledby={`tab-${f.name}`} hidden={active !== i} className="relative">
          <pre className="no-scrollbar max-h-[560px] overflow-auto p-5 pb-12 font-mono text-[12px] leading-[1.7] sm:text-[12.5px]">
            <code>
              {f.body.split('\n').map((line, j) => (
                <div key={j} className={`${tone(line)} whitespace-pre-wrap sm:whitespace-pre`}>
                  {line || ' '}
                </div>
              ))}
            </code>
          </pre>
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-white/0" />
        </div>
      ))}
    </div>
  )
}
