import Image from 'next/image'
import Link from 'next/link'
import CopyButton from '../components/CopyButton'

const INSTALL_CMD = 'curl -fsSL https://cold.md/install | bash'
const REPO_URL = 'https://github.com/foxreach/cold-md'
const SPEC_URL = `${REPO_URL}/blob/main/spec/cold-md-v0.md`
const PLUGIN_CMDS = '/plugin marketplace add foxreach/cold-md\n/plugin install cold-md@cold-md'

const SKILLS = [
  { num: '01', name: 'cold-icp',        desc: 'Build icp.md from a URL or Q&A, then check it with web search: competitors, title prevalence, pain language.',                       needsKey: false },
  { num: '02', name: 'cold-offer',      desc: 'Sharpen the value prop with competitor pricing and market research. Writes offer.md and proposes a ## Value diff.',                 needsKey: false },
  { num: '03', name: 'cold-leads',      desc: 'Import a CSV or search the FoxReach Lead Finder database. Scores every lead against icp.md, verifies emails, then imports.',       needsKey: true  },
  { num: '04', name: 'cold-research',   desc: 'Per-lead research bundles for personalization tests. Parallel batches, one cited hook per lead, A/B arm assignments.',             needsKey: false },
  { num: '05', name: 'cold-draft',      desc: 'Draft openers, bumps and breakups that obey cold.md. Writes a control and a variant when an experiment is running.',               needsKey: false },
  { num: '06', name: 'cold-send',       desc: 'Creates the campaign with pre-flight checks: banned phrases, audience, verification, mailbox health, provider match, duplicates.', needsKey: true  },
  { num: '07', name: 'cold-experiment', desc: 'Picks the next A/B from the variable ladder (subject, opener, CTA, cadence, tone) and writes the protocol before anything sends.', needsKey: false },
  { num: '08', name: 'cold-learn',      desc: 'Reads per-variant reply categories, runs a z-test on interested-reply rate and proposes a cold.md diff for your approval.',          needsKey: true  },
  { num: '09', name: 'cold-triage',     desc: 'Categorizes unread replies and drafts answers from ## Objections. Nothing is sent until you approve it.',                           needsKey: true  },
  { num: '10', name: 'cold-status',     desc: 'One screen: what the experiments have taught you, what is running, pending diffs, the next step.',                                  needsKey: false },
  { num: '11', name: 'cold-report',     desc: 'Daily or weekly digest of sends, replies, mailbox health and experiment outcomes. Also runs /cold audit on a sending domain.',      needsKey: true  },
] as const

const FOXREACH_PIECES = [
  { title: 'Lead Finder',        cmd: 'foxreach lead-finder count',       desc: 'Turns icp.md into people-database filters. Counting is free; you approve the reveal cost before any work email is revealed.' },
  { title: 'Email verification', cmd: 'foxreach verification verify-bulk', desc: 'Every CSV lead is checked before import. Bad addresses are dropped, and only definite good or bad verdicts use a credit.' },
  { title: 'Provider matching',  cmd: 'foxreach campaigns esp-mix',       desc: 'Shows how your mailboxes and your leads split across Google, Microsoft and the rest, so the first email can go out from the same provider.' },
  { title: 'Mailbox health',     cmd: 'foxreach accounts health',         desc: 'Health is the share of warmup mail that lands in the inbox. cold-send leaves out any mailbox under your floor before the campaign starts.' },
  { title: 'A/B variants',       cmd: 'foxreach sequences list',          desc: 'cold-send writes your control and hands you the variant to paste into the campaign step, then reads the variant IDs back for the test.' },
  { title: 'Reply stats',        cmd: 'foxreach inbox categorize-stats',  desc: 'Reply categories per variant, step and day. This is what the z-test in cold-learn runs on.' },
] as const

const SPEC_SNIPPET = `# My Product - cold.md

## Identity    - who's sending
## Audience    - ICP + disqualifiers
## Value       - the offer, in one sentence
## Voice       - dos and don'ts, obeyed verbatim
## Proof       - facts the agent may cite
## Sequence    - opener, bump, breakup slots
## Objections  - preferred replies to pushbacks
## Banned      - phrases that never appear`

const CMD_STACK = [
  ['/cold init', 'set up .cold/, check your FoxReach key'],
  ['/cold icp https://your-site.com', 'who to reach'],
  ['/cold leads --finder --count 200', 'source, score, verify'],
  ['/cold experiment', 'pick the next A/B'],
  ['/cold draft Jane, CEO at Acme', 'control + variant'],
  ['/cold send', 'pre-flight, create, start'],
  ['/cold triage', 'daily: sort replies'],
  ['/cold learn', 'a week later: z-test, cold.md diff'],
  ['/cold report weekly', 'digest on cron'],
] as const

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between">
        <Link href="/" className="font-mono text-sm font-medium tracking-tight">cold.md</Link>
        <div className="flex items-center gap-6 text-sm text-muted">
          <Link href="#loop" className="hover:text-ink transition-colors">the loop</Link>
          <Link href="#skills" className="hover:text-ink transition-colors">skills</Link>
          <Link href="#foxreach" className="hover:text-ink transition-colors hidden sm:inline">foxreach</Link>
          <Link href="#install" className="hover:text-ink transition-colors">install</Link>
          <Link href="#spec" className="hover:text-ink transition-colors">spec</Link>
          <a href={REPO_URL} target="_blank" rel="noreferrer" className="hover:text-ink transition-colors">github</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-12 sm:pt-20 pb-16">
        <div className="flex items-center gap-2 text-xs font-mono text-fox mb-8">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-fox animate-pulse" />
          v0.3 - eleven skills, one /cold command. Lead Finder, verification and provider matching built in.
        </div>

        <h1 className="font-display text-hero text-ink max-w-5xl">
          Cold outreach that<br />
          <span className="italic text-fox">improves itself</span>.
        </h1>

        <p className="mt-8 max-w-2xl text-lg sm:text-xl leading-relaxed text-ink/75">
          <strong className="text-ink">Karpathy-style autoresearch for cold email.</strong> An agent
          picks the next variable to test, runs an A/B against your real campaign,
          measures interested-reply rate, and proposes a diff to your{' '}
          <code className="font-mono text-base px-1.5 py-0.5 bg-fox-tint text-fox rounded">cold.md</code>{' '}
          policy file. Runs on{' '}
          <a href="https://www.foxreach.io" className="underline decoration-fox/40 underline-offset-4 hover:decoration-fox">FoxReach</a>{' '}
          infrastructure.{' '}
          <a href="https://www.foxreach.io/blog/cold-md-autoresearch" className="underline decoration-fox/40 underline-offset-4 hover:decoration-fox">
            Read the deep dive →
          </a>
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link href="#install" className="group inline-flex items-center gap-2 bg-ink text-paper px-5 py-3 rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors">
            Install the suite
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
          <Link href="#loop" className="inline-flex items-center gap-2 text-sm text-ink/70 hover:text-ink px-5 py-3 rounded-lg border border-line hover:border-ink/30 transition-colors">
            See the loop
          </Link>
          <a href={REPO_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-ink/70 hover:text-ink px-5 py-3">
            <GitHubGlyph />GitHub
          </a>
        </div>

        {/* Cover banner */}
        <div className="mt-14 rounded-xl overflow-hidden border border-line shadow-[0_24px_48px_-24px_rgba(26,21,18,0.25)]">
          <Image
            src="/cover.webp"
            alt="cold.md - One markdown file that runs your cold outreach"
            width={1800}
            height={600}
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="w-full h-auto"
          />
        </div>
      </section>

      {/* The loop */}
      <section id="loop" className="border-y border-line bg-white/60">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <div className="text-xs font-mono text-muted uppercase tracking-wider mb-3">the loop</div>
          <h2 className="font-display text-4xl sm:text-5xl leading-tight mb-4">
            One loop. One command per step.
          </h2>
          <p className="text-ink/70 max-w-2xl mb-12 leading-relaxed">
            Every step reads and writes files your team can review: cold.md, icp.md and the
            experiment log in .cold/. The policy is yours and portable; FoxReach is the sending layer
            the skills call today.
          </p>

          <div className="rounded-xl border border-line bg-ink text-paper overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-paper/10 bg-paper/5">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-paper/20" />
                  <span className="w-2.5 h-2.5 rounded-full bg-paper/20" />
                  <span className="w-2.5 h-2.5 rounded-full bg-paper/20" />
                </div>
                <span className="font-mono text-xs text-paper/50 ml-2">terminal</span>
              </div>
              <CopyButton text={CMD_STACK.map(([cmd]) => cmd).join('\n')} label="copy loop" />
            </div>
            <pre className="p-5 sm:p-8 text-sm sm:text-base font-mono leading-loose overflow-x-auto no-scrollbar">
              <code>
                {CMD_STACK.map(([cmd, note], i) => (
                  <div key={cmd} className="flex items-baseline gap-4">
                    <span className="text-fox-light tabular-nums w-8 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-paper/90 whitespace-nowrap">{cmd}</span>
                    <span className="hidden md:inline text-paper/40 text-sm whitespace-nowrap"># {note}</span>
                  </div>
                ))}
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* Skills grid */}
      <section id="skills" className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <div className="text-xs font-mono text-muted uppercase tracking-wider mb-3">the eleven skills</div>
        <h2 className="font-display text-4xl sm:text-5xl leading-tight mb-10">
          Each skill owns one file.
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-line rounded-xl overflow-hidden border border-line">
          {SKILLS.map((s) => (
            <div key={s.name} className="bg-white p-6 sm:p-7 hover:bg-fox-tint/30 transition-colors relative">
              <div className="flex items-baseline justify-between mb-3">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-xs text-muted tabular-nums">{s.num}</span>
                  <h3 className="font-mono text-base font-medium text-fox">{s.name}</h3>
                </div>

              </div>
              <p className="text-sm text-ink/75 leading-relaxed mb-3">{s.desc}</p>
              {s.needsKey && (
                <div className="text-[11px] font-mono text-muted">requires FOXREACH_API_KEY</div>
              )}
            </div>
          ))}
          <a href={SPEC_URL} target="_blank" rel="noreferrer" className="group bg-fox-tint/40 p-6 sm:p-7 hover:bg-fox-tint transition-colors flex flex-col justify-between">
            <p className="text-sm text-ink/75 leading-relaxed">
              The spec is vendor-neutral. The sending skills call the foxreach CLI today; a version for another platform is a welcome PR.
            </p>
            <span className="mt-4 font-mono text-sm text-fox">read the spec <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span></span>
          </a>
        </div>

        <p className="mt-8 text-sm text-muted">
          Every skill reads <code className="font-mono text-xs px-1 py-0.5 bg-fox-tint text-fox rounded">cold.md</code>{' '}
          or <code className="font-mono text-xs px-1 py-0.5 bg-fox-tint text-fox rounded">icp.md</code>{' '}
          from your repo. Files travel with your team, not with your vendor.
        </p>
      </section>

      {/* What runs on FoxReach */}
      <section id="foxreach" className="border-t border-line bg-white/60">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <div className="text-xs font-mono text-muted uppercase tracking-wider mb-3">the sending layer</div>
          <h2 className="font-display text-4xl sm:text-5xl leading-tight mb-4 max-w-3xl">
            The skills decide. FoxReach does the sending.
          </h2>
          <p className="text-ink/70 max-w-2xl mb-12 leading-relaxed">
            The FoxReach-backed skills call the public{' '}
            <a href="https://www.foxreach.io/docs/sdks/cli" target="_blank" rel="noreferrer" className="underline decoration-fox/40 underline-offset-4 hover:decoration-fox">foxreach CLI</a>{' '}
            and API. These are the pieces they use, and the command behind each one.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-line rounded-xl overflow-hidden border border-line">
            {FOXREACH_PIECES.map((p) => (
              <div key={p.title} className="bg-white p-6 sm:p-7">
                <h3 className="font-medium text-ink mb-2">{p.title}</h3>
                <p className="text-sm text-ink/75 leading-relaxed mb-4">{p.desc}</p>
                <code className="font-mono text-[11px] text-fox bg-fox-tint px-1.5 py-0.5 rounded break-all">{p.cmd}</code>
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-muted max-w-2xl">
            Variants are added in the FoxReach campaign editor because the public API reads them but does not create
            them yet.{' '}
            <a href="https://www.foxreach.io/docs/product/ab-testing" target="_blank" rel="noreferrer" className="text-ink hover:text-fox">How A/B testing works in FoxReach</a>.
          </p>
        </div>
      </section>

      {/* Install */}
      <section id="install" className="border-y border-line bg-ink text-paper">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <div className="text-xs font-mono text-fox-light uppercase tracking-wider mb-3">install</div>
          <h2 className="font-display text-4xl sm:text-5xl leading-tight mb-10 max-w-3xl">
            One command.<br />Eleven skills. One loop.
          </h2>

          <div className="rounded-xl border border-paper/10 bg-paper/5 overflow-hidden max-w-3xl">
            <div className="px-5 py-3 border-b border-paper/10 flex items-center justify-between">
              <span className="font-mono text-xs text-paper/50">terminal</span>
              <CopyButton text={INSTALL_CMD} label="copy command" />
            </div>
            <pre className="p-6 text-sm sm:text-base font-mono overflow-x-auto no-scrollbar">
              <code>
                <span className="text-paper/40">$ </span>
                <span className="text-paper">curl -fsSL </span>
                <span className="text-fox-light">https://cold.md/install</span>
                <span className="text-paper"> | bash</span>
              </code>
            </pre>
          </div>

          <div className="mt-6 rounded-xl border border-paper/10 bg-paper/5 overflow-hidden max-w-3xl">
            <div className="px-5 py-3 border-b border-paper/10 flex items-center justify-between">
              <span className="font-mono text-xs text-paper/50">or inside Claude Code</span>
              <CopyButton text={PLUGIN_CMDS} label="copy commands" />
            </div>
            <pre className="p-6 text-sm sm:text-base font-mono overflow-x-auto no-scrollbar text-paper">
              <code>{PLUGIN_CMDS}</code>
            </pre>
          </div>

          <div className="mt-10 grid sm:grid-cols-3 gap-8 max-w-4xl">
            {[
              ['01', 'Installs the plugin', 'Adds the foxreach/cold-md marketplace and installs all eleven skills plus /cold. Re-run to update.'],
              ['02', 'Sets up your repo', 'In Claude Code, /cold init asks nine questions and writes .cold/config.json. --scaffold starts cold.md and icp.md.'],
              ['03', 'Runs the loop', '/cold icp https://your-site.com, then leads, draft, send. A week later, /cold learn.'],
            ].map(([num, title, desc]) => (
              <div key={num}>
                <div className="font-mono text-xs text-fox-light mb-3 tabular-nums">{num}</div>
                <div className="font-medium text-paper mb-1">{title}</div>
                <div className="text-sm text-paper/70 leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-sm text-paper/60 max-w-2xl">
            The FoxReach-backed skills (leads, send, learn, triage, report) need{' '}
            <code className="font-mono text-xs bg-paper/10 px-1.5 py-0.5 rounded">pip install foxreach-cli</code> and{' '}
            <code className="font-mono text-xs bg-paper/10 px-1.5 py-0.5 rounded">FOXREACH_API_KEY=otr_...</code>{' '}
            from Settings, API Keys.{' '}
            <a href="https://www.foxreach.io/signup" target="_blank" rel="noreferrer" className="text-fox-light hover:text-paper">Create a FoxReach account →</a>
          </div>

          <div className="mt-6 text-xs text-paper/40">
            No plugin, just skills in ~/.claude? <code className="font-mono bg-paper/10 px-1.5 py-0.5 rounded">curl -fsSL https://cold.md/install | bash -s -- --skills-only</code>
          </div>
        </div>
      </section>

      {/* The cold.md spec */}
      <section id="spec" className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <div className="grid lg:grid-cols-2 gap-14 items-start">
          <div>
            <div className="text-xs font-mono text-muted uppercase tracking-wider mb-3">the cold.md file</div>
            <h2 className="font-display text-4xl sm:text-5xl leading-tight mb-6">
              The portable brief every skill reads.
            </h2>
            <p className="text-ink/75 leading-relaxed mb-5">
              One markdown file in your repo. Eight sections. Any conforming agent reads it
              before generating a single email.
            </p>
            <ul className="space-y-3 text-sm text-ink/75">
              <li className="flex gap-3"><span className="font-mono text-fox">→</span>Banned phrases are a <strong>hard filter</strong>, not a guideline.</li>
              <li className="flex gap-3"><span className="font-mono text-fox">→</span>Voice rules are <strong>enforced verbatim</strong> - not "inspired by."</li>
              <li className="flex gap-3"><span className="font-mono text-fox">→</span>Only facts from <code className="font-mono text-xs px-1 py-0.5 bg-fox-tint text-fox rounded">## Proof</code> can be cited. No fabricated numbers.</li>
              <li className="flex gap-3"><span className="font-mono text-fox">→</span>Audience disqualifiers are respected - won't contact leads who fail your ICP.</li>
            </ul>
            <div className="mt-8 flex gap-3">
              <a href={SPEC_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-ink hover:text-fox">
                Read the v0 spec →
              </a>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-white overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-line bg-paper/60">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-line" />
                <span className="w-2.5 h-2.5 rounded-full bg-line" />
                <span className="w-2.5 h-2.5 rounded-full bg-line" />
              </div>
              <span className="font-mono text-xs text-muted ml-2">./cold.md</span>
            </div>
            <pre className="p-5 sm:p-7 text-sm font-mono leading-relaxed overflow-x-auto no-scrollbar">
              <code className="text-ink">
                {SPEC_SNIPPET.split('\n').map((line, i) => (
                  <div key={i} className={line.startsWith('#') ? 'text-fox' : ''}>
                    {line || '\u00A0'}
                  </div>
                ))}
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* Why this, not another skill */}
      <section className="border-y border-line bg-white/60">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <div className="text-xs font-mono text-muted uppercase tracking-wider mb-3">why a suite, not a skill</div>
          <h2 className="font-display text-3xl sm:text-4xl leading-tight mb-10 max-w-3xl">
            Other Claude Code cold-email skills draft. Drafting is one step of the loop.
          </h2>
          <div className="grid sm:grid-cols-2 gap-10">
            <div>
              <div className="font-mono text-xs text-muted uppercase tracking-wider mb-3">single skill</div>
              <ul className="space-y-2 text-sm text-ink/70">
                <li>- Writes copy when asked</li>
                <li>- No ICP, no lead sourcing, no sending</li>
                <li>- No reply triage, no reporting</li>
                <li>- Never learns from what got replies</li>
                <li>- Every project starts from scratch</li>
                <li>- Config lives in the prompt, not the repo</li>
              </ul>
            </div>
            <div>
              <div className="font-mono text-xs text-fox uppercase tracking-wider mb-3">cold.md suite</div>
              <ul className="space-y-2 text-sm text-ink/90">
                <li>→ Every step of the loop has its own skill</li>
                <li>→ ICP, voice, proof, sequences committed to your repo</li>
                <li>→ A/B results rewrite cold.md, behind your approval</li>
                <li>→ <code className="font-mono text-xs px-1 bg-fox-tint text-fox rounded">/cold report</code> runs on a schedule, no dashboard to open</li>
                <li>→ Swap sending infra without rewriting anything</li>
                <li>→ Works for you, your team, your agents</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="mx-auto max-w-6xl px-6 py-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="font-mono text-sm font-medium mb-1">cold.md</div>
            <p className="text-sm text-muted max-w-md">
              Open spec, MIT + CC-BY-4.0. Built and maintained by the team at{' '}
              <a href="https://www.foxreach.io" target="_blank" rel="noreferrer" className="text-ink hover:text-fox">FoxReach</a>.
            </p>
          </div>
          <div className="flex items-center gap-5 text-sm text-muted">
            <a href={REPO_URL} target="_blank" rel="noreferrer" className="hover:text-ink">GitHub</a>
            <a href={SPEC_URL} target="_blank" rel="noreferrer" className="hover:text-ink">Spec v0</a>
            <a href="https://www.foxreach.io" target="_blank" rel="noreferrer" className="hover:text-ink">FoxReach</a>
          </div>
        </div>
      </footer>
    </main>
  )
}

function GitHubGlyph() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
    </svg>
  )
}
