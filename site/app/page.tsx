import Link from 'next/link'
import CopyButton from '../components/CopyButton'
import TerminalDemo from '../components/TerminalDemo'
import FileTabs from '../components/FileTabs'

const REPO_URL = 'https://github.com/foxreach/cold-md'
const SPEC_URL = `${REPO_URL}/blob/main/spec/cold-md-v0.md`
const INSTALL_CMD = 'curl -fsSL https://cold.md/install | bash'
const PLUGIN_CMDS = '/plugin marketplace add foxreach/cold-md\n/plugin install cold-md@cold-md'
const FOXREACH_CMDS = 'pip install foxreach-cli\nexport FOXREACH_API_KEY=otr_...'
const SKILLS_ONLY_CMD = 'curl -fsSL https://cold.md/install | bash -s -- --skills-only'
const DESIGN_URL = `${REPO_URL}/blob/main/spec/2026-04-28-autoresearch-design.md`

const SKILLS = [
  { stage: 'Who', name: 'cold-icp', cmd: '/cold icp', desc: 'Builds icp.md from your site or a short Q&A, then checks it with web research: competitors, title prevalence, pain language.', key: false },
  { stage: 'What', name: 'cold-offer', cmd: '/cold offer', desc: 'Sharpens the value prop with competitor pricing and market research. Writes offer.md and proposes a ## Value edit.', key: false },
  { stage: 'Leads', name: 'cold-leads', cmd: '/cold leads', desc: 'Imports your CSV or searches the FoxReach Lead Finder database, scores every lead against icp.md, verifies emails, imports.', key: true },
  { stage: 'Leads', name: 'cold-research', cmd: '/cold research', desc: 'Per-lead research bundles for personalization tests: one cited hook per lead, run in parallel batches.', key: false },
  { stage: 'Write', name: 'cold-draft', cmd: '/cold draft', desc: 'Openers, bumps and breakups that obey cold.md. Writes a control and a variant while an experiment runs.', key: false },
  { stage: 'Send', name: 'cold-send', cmd: '/cold send', desc: 'Pre-flight checks, then the campaign: steps, mailboxes, leads, provider matching. Asks before it starts.', key: true },
  { stage: 'Test', name: 'cold-experiment', cmd: '/cold experiment', desc: 'Picks one variable from the ladder (subject, opener, CTA, cadence, tone) and writes the protocol before anything sends.', key: false },
  { stage: 'Test', name: 'cold-learn', cmd: '/cold learn', desc: 'Reads reply categories per variant, runs a two-proportion z-test, and proposes a cold.md diff for your approval.', key: true },
  { stage: 'Replies', name: 'cold-triage', cmd: '/cold triage', desc: 'Categorizes unread replies and drafts answers from ## Objections. Nothing is sent until you approve it.', key: true },
  { stage: 'Report', name: 'cold-status', cmd: '/cold status', desc: 'One screen: what the tests have taught you, what is running, pending diffs and the next step.', key: false },
  { stage: 'Report', name: 'cold-report', cmd: '/cold report', desc: 'Daily or weekly digest of sends, replies, mailbox health and test outcomes. Also runs /cold audit on a domain.', key: true },
] as const

const PIECES = [
  { title: 'Lead Finder', cmd: 'foxreach lead-finder count', desc: 'icp.md becomes people-database filters. Counting is free, and you approve the reveal cost before any work email is revealed.' },
  { title: 'Email verification', cmd: 'foxreach verification verify-bulk', desc: 'Every CSV lead is checked before import. Bad addresses never reach a campaign; only definite good or bad verdicts use a credit.' },
  { title: 'Provider matching', cmd: 'foxreach campaigns esp-mix', desc: 'How your mailboxes and leads split across Google and Microsoft, so the first email can go out from the same provider.' },
  { title: 'Mailbox health', cmd: 'foxreach accounts health', desc: 'Health is the share of warmup mail that lands in the inbox. Mailboxes under your floor stay out of the campaign.' },
  { title: 'A/B variants', cmd: 'foxreach sequences variants add', desc: 'cold-send writes the control as the step, adds variants A and B to it, and records their IDs for cold-learn.' },
  { title: 'Reply categories', cmd: 'foxreach inbox categorize-stats', desc: 'Interested, not interested and out of office per variant, step and day. The z-test in cold-learn runs on these.' },
] as const

const STEPS = [
  { n: '01', title: 'Write the policy once', body: 'cold.md in your repo: who you are, who you write to, the offer, your voice, the facts you may cite, the sequence and the banned phrases.' },
  { n: '02', title: 'Run the loop', body: 'One /cold command per step. Leads, drafts, sending and replies all go through FoxReach, and every step leaves a file you can review.' },
  { n: '03', title: 'Approve what it learned', body: 'When a test finds a winner, cold-learn proposes an edit to cold.md with the numbers behind it. You apply it or reject it.' },
] as const

const COMPARE = [
  ['Drafts emails when you ask', true, true],
  ['Builds the ICP from your site', false, true],
  ['Finds and verifies leads', false, true],
  ['Sends with pre-flight checks', false, true],
  ['Sorts replies against your objections', false, true],
  ['A/B tests that edit the policy file', false, true],
  ['Policy committed to your repo, portable across tools', false, true],
] as const

const FAQS = [
  {
    q: 'What is cold.md?',
    a: 'Two things. An open spec (CC-BY-4.0) for describing your outbound as one markdown file with eight sections, and a Claude Code plugin (MIT) with eleven skills and a /cold command that read that file and run the outreach loop.',
  },
  {
    q: 'Does it send anything without asking?',
    a: 'No. Starting a campaign, revealing Lead Finder emails and sending a reply all wait for your yes. Edits to cold.md arrive as a patch you apply or reject; only after three approved edits in a row can it apply them on its own, and one rejection turns that off.',
  },
  {
    q: 'How does it decide a test has a winner?',
    a: 'cold-learn compares interested-reply rates between the control and the variant with a two-proportion z-test. A winner needs the minimum sample per variant (100 by default), the minimum days (7), a p-value under 0.05 and a confidence interval that excludes zero. Anything less is marked inconclusive and cold.md is left alone.',
  },
  {
    q: 'Do I need FoxReach?',
    a: 'Not for the spec, or for the skills that only read and write files (ICP, offer, research, drafting, status). Finding leads, sending, triage, learning from results and reports call the FoxReach CLI and API.',
  },
  {
    q: 'What does it cost?',
    a: 'The plugin and the spec are free and open source. Sending needs a FoxReach account; the free plan is enough to try the loop, and Lead Finder needs a paid plan with reveal credits.',
  },
  {
    q: 'Can I use cold.md with another sending tool?',
    a: 'The file is vendor-neutral, so any agent or tool can read it. The sending skills call the FoxReach CLI today; a version for another platform would be a new set of skills, and a pull request is welcome.',
  },
  {
    q: 'How is it different from the FoxReach Claude Code plugin?',
    a: 'The FoxReach plugin lets you ask Claude about anything in your workspace. cold.md is opinionated: one command per step of the loop, a policy file in your repo, and tests that propose edits to it. You can install both.',
  },
] as const

const DIFF = [
  { k: ' ', t: '### 1. Opener (Day 0)' },
  { k: '-', t: '- Subject: 5 words max, lowercase, a statement' },
  { k: '+', t: '- Subject: a question about their stack, 6 words max' },
  { k: ' ', t: '- Body: 40-60 words, one observable fact' },
] as const

export default function Home() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  }

  return (
    <main id="top" className="min-h-screen overflow-x-hidden">
      <a href="#how" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-white">Skip to content</a>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* Nav */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2" aria-label="cold.md home">
            <Mark />
            <span className="font-mono text-[15px] font-medium tracking-tight">cold.md</span>
          </Link>
          <div className="hidden items-center gap-7 text-sm text-ink-2 md:flex">
            <a href="#how" className="hover:text-ink">How it works</a>
            <a href="#skills" className="hover:text-ink">Skills</a>
            <a href="#foxreach" className="hover:text-ink">FoxReach</a>
            <a href="#spec" className="hover:text-ink">Spec</a>
            <a href="#faq" className="hover:text-ink">FAQ</a>
          </div>
          <div className="flex items-center gap-2">
            <a href={REPO_URL} target="_blank" rel="noreferrer" className="hidden items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm text-ink-2 hover:border-ink/20 hover:text-ink sm:inline-flex">
              <GitHubGlyph /> GitHub
            </a>
            <a href="#install" className="inline-flex items-center rounded-full bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink-2">
              Install
            </a>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="hero-glow relative">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-14 text-center sm:px-6 sm:pt-20">
          <a href="#foxreach" className="inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-white py-1 pl-1 pr-3 text-[13px] text-ink-2 shadow-card hover:border-ink/15">
            <span className="shrink-0 rounded-full bg-fox px-2.5 py-0.5 text-xs font-semibold text-white">v0.4</span>
            <span className="truncate"><span className="sm:hidden">A/B variants set up for you</span><span className="hidden sm:inline">A/B variants, Lead Finder, verification and provider matching built in</span></span>
            <span aria-hidden className="shrink-0">→</span>
          </a>

          <h1 className="mx-auto mt-7 max-w-4xl text-balance font-display text-hero font-semibold text-ink">
            Cold outreach that
            <br />
            <span className="font-serif font-normal italic tracking-[-0.02em] text-fox">improves itself.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-ink-2 sm:text-xl">
            One markdown file defines your outbound. Eleven Claude Code skills run it through FoxReach,
            test it, and propose edits to it from what got replies.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
            <a href="#install" className="group inline-flex items-center gap-3 rounded-full bg-fox py-2 pl-6 pr-2 text-[15px] font-semibold text-white shadow-cta hover:bg-fox-hover">
              Install the plugin
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-fox transition-transform group-hover:translate-x-0.5">
                <Arrow />
              </span>
            </a>
            <a href={SPEC_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[15px] font-medium text-ink hover:text-fox">
              Read the spec <Arrow />
            </a>
          </div>

          <div className="mx-auto mt-6 hidden max-w-md items-center justify-between gap-3 rounded-full border border-line bg-white/90 py-1.5 pl-4 pr-1.5 text-left shadow-card sm:flex">
            <code className="truncate font-mono text-[11px] text-ink-2 min-[400px]:text-[12px] sm:text-[13px]"><span className="hidden text-ink-4 sm:inline">$ </span>{INSTALL_CMD}</code>
            <CopyButton text={INSTALL_CMD} />
          </div>

          {/* The session window */}
          <div className="mx-auto mt-14 max-w-4xl overflow-hidden rounded-2xl border border-black/10 bg-night text-left shadow-window">
            <div className="flex items-center gap-3 border-b border-white/10 bg-night-2 px-4 py-3">
              <div className="flex gap-1.5" aria-hidden>
                <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
                <span className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
                <span className="h-3 w-3 rounded-full bg-[#28C840]" />
              </div>
              <div className="mx-auto hidden items-center gap-2 rounded-md bg-white/5 px-3 py-1 font-mono text-[11.5px] text-white/55 min-[420px]:flex">
                ~/northwind-outbound <span className="text-white/30">·</span> claude
              </div>
              <span className="shrink-0 rounded-full border border-white/15 px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-wider text-white/45"><span className="sm:hidden">example</span><span className="hidden sm:inline">example session</span></span>
            </div>
            <div className="no-scrollbar overflow-x-auto px-4 py-5 sm:px-7 sm:py-6">
              <TerminalDemo />
            </div>
          </div>
        </div>

        {/* Fact cells, as on the lifetime page */}
        <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
          <dl className="grid grid-cols-3 overflow-hidden rounded-2xl border border-line bg-white text-left shadow-card">
            {[
              ['Skills', '11'],
              ['Command', '/cold'],
              ['Price', 'Free'],
            ].map(([k, v], i) => (
              <div key={k} className={`px-4 py-4 sm:px-6 ${i > 0 ? 'border-l border-line' : ''}`}>
                <dt className="text-xs text-ink-3">{k}</dt>
                <dd className="mt-1 font-display text-xl font-semibold tracking-[-0.02em] sm:text-3xl">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Rails: everything below sits between thin vertical lines, as on foxreach.io */}
      <div className="mx-auto max-w-6xl border-x border-line">
        {/* How it works */}
        <section id="how" className="border-t border-line">
          <SectionHead eyebrow="How it works" title="One file. One loop." lede="cold.md is the brief every skill reads. The loop around it is what makes it get better instead of going stale." />
          <div className="grid grid-cols-1 border-t border-line md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.n} className={`px-6 py-8 sm:px-8 ${i > 0 ? 'border-t border-line md:border-l md:border-t-0' : ''}`}>
                <div className="font-mono text-xs font-medium text-fox">{s.n}</div>
                <h3 className="mt-3 text-lg font-semibold tracking-[-0.01em]">{s.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-3">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* The file */}
        <section id="spec" className="border-t border-line">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="px-6 py-14 sm:px-10 sm:py-20">
              <Eyebrow>The cold.md file</Eyebrow>
              <h2 className="mt-4 text-balance font-display text-h2 font-semibold">The brief every skill reads.</h2>
              <p className="mt-5 max-w-md text-[17px] leading-relaxed text-ink-2">
                Eight sections, in order, in plain markdown. Commit it next to your code and it travels with your team, not with your vendor.
              </p>
              <ul className="mt-8 space-y-4 text-[15px] text-ink-2">
                {[
                  ['Banned', 'is a hard filter. A banned phrase is never written.'],
                  ['Voice', 'rules are followed word for word, not as inspiration.'],
                  ['Proof', 'is the only source of facts. No invented numbers.'],
                  ['Audience', 'disqualifiers are enforced before anything sends.'],
                ].map(([k, v]) => (
                  <li key={k} className="flex gap-3">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-fox" />
                    <span><code className="rounded bg-fox-tint px-1.5 py-0.5 font-mono text-[13px] text-fox-deep">## {k}</code> {v}</span>
                  </li>
                ))}
              </ul>
              <a href={SPEC_URL} target="_blank" rel="noreferrer" className="mt-9 inline-flex items-center gap-2 text-[15px] font-medium hover:text-fox">
                Read the v0 spec <Arrow />
              </a>
            </div>
            <div className="dots min-w-0 border-t border-line p-4 sm:p-8 lg:border-l lg:border-t-0">
              <FileTabs />
            </div>
          </div>
        </section>

        {/* Tests that edit the file */}
        <section className="border-t border-line">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="dots order-2 flex min-w-0 flex-col justify-center border-t border-line p-4 sm:p-8 lg:order-1 lg:border-r lg:border-t-0">
              <div className="space-y-4">
                <div className="overflow-hidden rounded-xl border border-line bg-white shadow-lift">
                  <div className="flex items-center justify-between border-b border-line px-4 py-2.5 text-[12.5px]">
                    <span className="font-medium">tier-1 / subject line</span>
                    <span className="rounded-full bg-[#E8F7EE] px-2 py-0.5 text-[11px] font-medium text-good">winner: B</span>
                  </div>
                  <table className="w-full text-left text-[13px]">
                    <thead className="text-[11px] uppercase tracking-wider text-ink-4">
                      <tr><th className="px-4 py-2 font-medium">Arm</th><th className="px-4 py-2 font-medium">Sent</th><th className="px-4 py-2 font-medium">Interested</th><th className="px-4 py-2 text-right font-medium">Rate</th></tr>
                    </thead>
                    <tbody className="font-mono">
                      <tr className="border-t border-line"><td className="px-4 py-2.5">A statement</td><td className="px-4 py-2.5">412</td><td className="px-4 py-2.5">9</td><td className="px-4 py-2.5 text-right">2.2%</td></tr>
                      <tr className="border-t border-line bg-fox-tint/60"><td className="px-4 py-2.5 font-medium text-fox-deep">B question</td><td className="px-4 py-2.5">405</td><td className="px-4 py-2.5">21</td><td className="px-4 py-2.5 text-right font-medium text-fox-deep">5.2%</td></tr>
                    </tbody>
                  </table>
                  <div className="border-t border-line px-4 py-2.5 font-mono text-[12px] text-ink-3">+3.0pp · 95% CI [0.4, 5.6] · p = 0.02 · n = 817</div>
                </div>
                <div className="ml-auto overflow-hidden rounded-xl border border-line bg-white shadow-lift sm:w-[92%]">
                  <div className="flex items-center justify-between border-b border-line px-4 py-2.5 text-[12.5px]">
                    <span className="font-mono">.cold/proposed-diff.patch</span>
                    <span className="text-[11px] text-ink-4">awaiting your approval</span>
                  </div>
                  <pre className="no-scrollbar overflow-x-auto py-2 font-mono text-[12px] leading-[1.8] sm:text-[12.5px]">
                    <code>
                      {DIFF.map((d, i) => (
                        <div key={i} className={`whitespace-pre-wrap px-4 sm:whitespace-pre ${d.k === '+' ? 'bg-[#E8F7EE] text-[#166534]' : d.k === '-' ? 'bg-[#FDECEC] text-[#991B1B]' : 'text-ink-3'}`}>
                          <span className="mr-3 select-none opacity-60">{d.k}</span>{d.t}
                        </div>
                      ))}
                    </code>
                  </pre>
                </div>
              </div>
              <p className="mt-4 text-center text-xs text-ink-4">Example numbers</p>
            </div>
            <div className="order-1 px-6 py-14 sm:px-10 sm:py-20 lg:order-2">
              <Eyebrow>Autoresearch</Eyebrow>
              <h2 className="mt-4 text-balance font-display text-h2 font-semibold">Tests that edit <span className="font-serif font-normal italic tracking-[-0.01em] text-fox">the file.</span></h2>
              <p className="mt-5 max-w-md text-[17px] leading-relaxed text-ink-2">
                cold-experiment picks one variable and writes the test down before anything sends. A week later cold-learn reads the replies per variant and runs the numbers.
              </p>
              <ul className="mt-8 space-y-5">
                {[
                  ['Winner', 'A proposed patch to cold.md, with the sample, lift, confidence interval and p-value next to it.'],
                  ['Inconclusive', 'cold.md is left alone. The test is extended or closed, and the next variable is up.'],
                  ['Trust', 'After three approved patches in a row it can apply them itself. One rejection turns that off.'],
                ].map(([k, v]) => (
                  <li key={k} className="flex gap-4">
                    <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${k === 'Winner' ? 'bg-[#E8F7EE]' : k === 'Trust' ? 'bg-fox-tint' : 'bg-grey'}`} aria-hidden>
                      <span className={`h-2 w-2 rounded-full ${k === 'Winner' ? 'bg-good' : k === 'Trust' ? 'bg-fox' : 'bg-ink-4'}`} />
                    </span>
                    <div><div className="font-semibold">{k}</div><p className="mt-1 text-[15px] leading-relaxed text-ink-3">{v}</p></div>
                  </li>
                ))}
              </ul>
              <a href={DESIGN_URL} target="_blank" rel="noreferrer" className="mt-9 inline-flex items-center gap-2 text-[15px] font-medium hover:text-fox">
                How cold-learn decides <Arrow />
              </a>
            </div>
          </div>
        </section>

        {/* Skills */}
        <section id="skills" className="border-t border-line">
          <SectionHead eyebrow="The skills" title="Eleven skills. Each owns one step." lede="Every skill reads cold.md or icp.md and writes a file you can review. Call them through /cold or on their own." />
          <div className="grid grid-cols-1 gap-px border-t border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {SKILLS.map((s) => (
              <div key={s.name} className="flex flex-col bg-white px-6 py-7 sm:px-8">
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-fox">{s.stage}</div>
                <h3 className="mt-2 font-mono text-[15px] font-medium">{s.name}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-ink-3">{s.desc}</p>
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
                  <code className="rounded-md border border-line bg-panel px-2 py-0.5 font-mono text-[11.5px] text-ink-2">{s.cmd}</code>
                  {s.key && <span className="rounded-full bg-grey px-2.5 py-0.5 text-[11px] text-ink-3">Needs a FoxReach key</span>}
                </div>
              </div>
            ))}
            <a href={SPEC_URL} target="_blank" rel="noreferrer" className="group flex flex-col justify-between bg-fox-tint px-6 py-7 hover:bg-fox-light/50 sm:px-8">
              <p className="text-[14.5px] leading-relaxed text-ink-2">The spec is vendor-neutral. The sending skills call the FoxReach CLI today; a version for another platform is a welcome PR.</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-fox">Read the spec <Arrow /></span>
            </a>
          </div>
        </section>
      </div>

      {/* The sending layer, dark like the agents section on foxreach.io */}
      {/* Hatched margins outside a solid column with corner dots, as on foxreach.io */}
      <section id="foxreach" className="overflow-x-clip bg-night text-white [background-image:repeating-linear-gradient(-60deg,rgba(255,255,255,0.07)_0_1px,transparent_1px_8px)]">
        <div className="relative mx-auto max-w-6xl border-x border-white/10 bg-night">
          {['-left-[4px] -top-[4px]', '-right-[4px] -top-[4px]', '-left-[4px] -bottom-[4px]', '-right-[4px] -bottom-[4px]'].map((pos) => (
            <span key={pos} aria-hidden className={`pointer-events-none absolute z-10 hidden h-[7px] w-[7px] rounded-full bg-[#6B6B6B] min-[1200px]:block ${pos}`} />
          ))}
          <div className="px-6 py-16 sm:px-10 sm:py-24">
            <div className="flex items-center gap-2 text-[13px] text-white/60"><span className="flex h-4 w-4 items-center justify-center rounded-[5px] bg-fox/25"><span className="h-1.5 w-1.5 rounded-[2px] bg-fox" /></span>The sending layer</div>
            <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-end">
              <h2 className="text-balance font-display text-h2 font-semibold">The skills decide.<br /><span className="font-serif font-normal italic tracking-[-0.01em] text-[#FF9A5C]">FoxReach sends.</span></h2>
              <p className="max-w-md text-[17px] leading-relaxed text-white/65">
                The sending skills call the public <a href="https://www.foxreach.io/docs/sdks/cli" target="_blank" rel="noreferrer" className="text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">FoxReach CLI</a> and API. These are the pieces they use and the command behind each.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PIECES.map((p) => (
                <div key={p.title} className="rounded-xl border border-night-line bg-night-2/90 p-5">
                  <h3 className="font-semibold">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">{p.desc}</p>
                  <code className="mt-4 inline-block break-all rounded-md bg-white/5 px-2 py-1 font-mono text-[11.5px] text-[#FF9A5C]">{p.cmd}</code>
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-2 text-sm">
              <span className="mr-1 text-white/55">Read more:</span>
              {[
                ['cold.md setup guide', 'https://www.foxreach.io/docs/integrations/cold-md'],
                ['A/B testing in FoxReach', 'https://www.foxreach.io/docs/product/ab-testing'],
                ['CLI', 'https://www.foxreach.io/docs/sdks/cli'],
                ['API', 'https://www.foxreach.io/docs/introduction'],
              ].map(([label, href]) => (
                <a key={href} href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[13px] font-medium text-ink hover:bg-white/90">
                  {label} <span aria-hidden>↗</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl border-x border-line">
        {/* Comparison */}
        <section className="border-b border-line">
          <SectionHead eyebrow="Why a suite" title="Other cold email skills draft. That is one step." lede="Drafting is where the work starts. The loop is what turns sends into a better policy." />
          <div className="border-t border-line">
            <table className="w-full table-fixed text-left text-[14px] sm:text-[15px]">
              <colgroup><col /><col className="w-[76px] sm:w-[180px]" /><col className="w-[76px] sm:w-[140px]" /></colgroup>
              <thead>
                <tr className="text-xs text-ink-3">
                  <th className="px-4 py-3 font-medium sm:px-8">What you get</th>
                  <th className="px-2 py-3 text-center font-medium"><span className="sm:hidden">Others</span><span className="hidden sm:inline">A cold email skill</span></th>
                  <th className="bg-fox-tint px-2 py-3 text-center font-semibold text-fox-deep">cold.md</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map(([label, a, b]) => (
                  <tr key={label} className="border-t border-line">
                    <td className="px-4 py-3.5 sm:px-8">{label}</td>
                    <td className="px-2 py-3.5 text-center">{a ? <Tick /> : <Dash />}</td>
                    <td className="bg-fox-tint px-2 py-3.5 text-center">{b ? <Tick fox /> : <Dash />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Install */}
        <section id="install">
          <SectionHead eyebrow="Install" title="Live in three steps." lede="Works in Claude Code on macOS, Linux and Windows. Re-run the installer any time to update." />
          <div className="grid grid-cols-1 border-t border-line md:grid-cols-3">
            {[
              { n: '01', title: 'Install the plugin', note: 'In a terminal, or inside Claude Code:', blocks: [INSTALL_CMD, PLUGIN_CMDS] },
              { n: '02', title: 'Connect FoxReach', note: 'Create a key under Settings > Integrations > API Keys.', blocks: [FOXREACH_CMDS] },
              { n: '03', title: 'Set up your repo', note: 'Nine questions, then .cold/config.json is written.', blocks: ['/cold init'] },
            ].map((s, i) => (
              <div key={s.n} className={`flex min-w-0 flex-col px-6 py-8 sm:px-8 ${i > 0 ? 'border-t border-line md:border-l md:border-t-0' : ''}`}>
                <div className="font-mono text-xs font-medium text-fox">{s.n}</div>
                <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-ink-3">{s.note}</p>
                <div className="mt-5 space-y-2.5">
                  {s.blocks.map((b) => (
                    <div key={b} className="overflow-hidden rounded-xl bg-night">
                      <div className="flex items-center justify-between border-b border-white/10 px-3.5 py-2">
                        <span className="font-mono text-[11px] text-white/45">{b.startsWith('/') ? 'claude code' : 'terminal'}</span>
                        <CopyButton text={b} variant="dark" />
                      </div>
                      <pre className="whitespace-pre-wrap [overflow-wrap:anywhere] px-3.5 py-3 font-mono text-[12.5px] leading-relaxed text-white/85"><code>{b}</code></pre>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3 border-t border-line px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <p className="text-sm text-ink-3">No plugin, just the skills in ~/.claude:</p>
            <div className="flex min-w-0 items-center justify-between gap-3 rounded-full border border-line bg-panel py-1 pl-4 pr-1">
              <code className="no-scrollbar min-w-0 overflow-x-auto whitespace-nowrap font-mono text-[12px] text-ink-2">{SKILLS_ONLY_CMD}</code>
              <CopyButton text={SKILLS_ONLY_CMD} />
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t border-line">
          <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="px-6 py-14 sm:px-10 sm:py-20 lg:sticky lg:top-16 lg:self-start">
              <Eyebrow>FAQ</Eyebrow>
              <h2 className="mt-4 text-balance font-display text-h2 font-semibold">Questions, answered.</h2>
              <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-ink-3">
                Anything else: open an issue on <a href={REPO_URL} target="_blank" rel="noreferrer" className="text-ink underline decoration-ink/20 underline-offset-4 hover:decoration-ink">GitHub</a>.
              </p>
            </div>
            <div className="border-t border-line lg:border-l lg:border-t-0">
              {FAQS.map((f, i) => (
                <details key={f.q} className={`group ${i > 0 ? 'border-t border-line' : ''}`} open={i === 0}>
                  <summary className="flex cursor-pointer items-center justify-between gap-6 px-6 py-5 text-[16px] font-semibold outline-none hover:bg-panel focus-visible:bg-panel focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-fox sm:px-8">
                    {f.q}
                    <span className="faq-plus text-xl font-normal text-ink-3 transition-transform" aria-hidden>+</span>
                  </summary>
                  <p className="px-6 pb-6 text-[15px] leading-relaxed text-ink-2 sm:px-8">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Closer */}
        <section className="border-t border-line px-4 py-10 sm:px-8 sm:py-14">
          <div className="fox-gradient relative overflow-hidden rounded-3xl px-6 py-16 text-center text-white sm:px-12 sm:py-20">
            <h2 className="text-balance font-display text-h2 font-semibold">
              Your next campaign is
              <br />
              <span className="font-serif font-normal italic tracking-[-0.01em]">one file away.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-[17px] text-white/85">Install the plugin, run /cold init, and write cold.md once.</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
              <a href="#install" className="group inline-flex items-center gap-3 rounded-full bg-white py-2 pl-6 pr-2 text-[15px] font-semibold text-ink hover:bg-white/95">
                Install cold.md
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-fox text-white transition-transform group-hover:translate-x-0.5"><Arrow /></span>
              </a>
              <a href={REPO_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[15px] font-medium text-white underline decoration-white/40 underline-offset-4 hover:decoration-white">
                Star it on GitHub
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-10 px-6 py-12 sm:grid-cols-[1.4fr_1fr_1fr_1fr] sm:px-8">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2"><Mark /><span className="font-mono text-[15px] font-medium">cold.md</span></div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-3">Open spec (CC-BY-4.0) and Claude Code plugin (MIT).</p>
            <a href="https://www.foxreach.io" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm text-ink-2 hover:text-ink">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/fox-mark.svg" alt="" width={18} height={18} /> Built by FoxReach
            </a>
          </div>
          <FooterCol title="cold.md" links={[['How it works', '#how'], ['Skills', '#skills'], ['Install', '#install'], ['FAQ', '#faq']]} />
          <FooterCol title="Source" links={[['GitHub', REPO_URL], ['Spec v0', SPEC_URL], ['Examples', `${REPO_URL}/tree/main/examples`], ['llms.txt', '/llms.txt']]} />
          <FooterCol title="FoxReach" links={[['Setup guide', 'https://www.foxreach.io/docs/integrations/cold-md'], ['Integration page', 'https://www.foxreach.io/integrations/ai-clients/cold-md'], ['CLI docs', 'https://www.foxreach.io/docs/sdks/cli'], ['Create an account', 'https://www.foxreach.io/signup']]} />
        </div>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-5 text-xs text-ink-4 sm:px-8">
          <span>© 2026 FoxReach. Spec CC-BY-4.0, code MIT.</span>
          <a href="#top" className="hover:text-ink">Back to top ↑</a>
        </div>
      </footer>
    </main>
  )
}

function SectionHead({ eyebrow, title, lede }: { eyebrow: string; title: string; lede: string }) {
  return (
    <div className="grid grid-cols-1 gap-5 px-6 py-14 sm:px-10 sm:py-20 lg:grid-cols-[1.25fr_1fr] lg:items-end">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="mt-4 max-w-2xl text-balance font-display text-h2 font-semibold">{title}</h2>
      </div>
      <p className="max-w-md text-pretty text-[17px] leading-relaxed text-ink-3">{lede}</p>
    </div>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[13px] text-ink-3">
      <span className="flex h-4 w-4 items-center justify-center rounded-[5px] bg-fox-light"><span className="h-1.5 w-1.5 rounded-[2px] bg-fox" /></span>
      {children}
    </div>
  )
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-3">{title}</div>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map(([label, href]) => (
          <li key={label}>
            <a href={href} {...(href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})} className="text-ink-2 hover:text-ink">{label}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Mark() {
  // cold.md mark: a black tile with a markdown heading hash and the fox-orange dot.
  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden>
      <rect width="32" height="32" rx="8" fill="#000" />
      <path d="M11 9.5 9.5 22.5M17 9.5l-1.5 13M7.5 13.5h12M7 18.5h12" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="24" cy="21" r="2.6" fill="#EA580C" />
    </svg>
  )
}

function Arrow() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden>
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Tick({ fox }: { fox?: boolean }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={`mx-auto h-4 w-4 ${fox ? 'text-fox' : 'text-ink-2'}`} role="img" aria-label="yes">
      <path d="M3 8.5l3.2 3.2L13 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Dash() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="mx-auto h-4 w-4 text-ink-4/70" role="img" aria-label="no">
      <path d="M4.5 8h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function GitHubGlyph() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}
