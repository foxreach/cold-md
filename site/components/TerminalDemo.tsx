'use client'

import { useEffect, useRef, useState } from 'react'

// An example /cold session. The lines mirror what cold-send and cold-learn
// print (plugin/cold-md/skills/*/SKILL.md); the numbers are illustrative and
// the page labels the window "example session". The z-test line is consistent:
// 9/412 vs 21/405 gives +3.0pp, z=2.28, p=0.02, 95% CI [0.4, 5.6].
// m is the phone version of a line: same meaning, short enough not to wrap at 360 px.
type Line = { t: string; m?: string; tone?: 'dim' | 'ok' | 'fox' | 'head' | 'plain' }
type Run = { cmd: string; out: Line[] }

const RUNS: Run[] = [
  {
    cmd: '/cold send',
    out: [
      { t: 'Pre-flight', tone: 'head' },
      { t: '✓ Banned phrases     0 hits across 3 steps', m: '✓ Banned phrases  0 hits', tone: 'ok' },
      { t: '✓ Variables          {{firstName|there}} fallback set', m: '✓ Variables       fallbacks set', tone: 'ok' },
      { t: '✓ Audience           12 leads removed by "Not for"', m: '✓ Audience        12 removed', tone: 'ok' },
      { t: '✓ Mailboxes          4 of 4 above health 70', m: '✓ Mailboxes       4 of 4 healthy', tone: 'ok' },
      { t: '✓ Provider matching  on, senders and leads on Google + Microsoft', m: '✓ Provider match  on', tone: 'ok' },
      { t: 'Ready to start "Q1 CTO outreach": 3 steps, 188 leads, 4 accounts', m: 'Ready: 3 steps, 188 leads, 4 accounts', tone: 'plain' },
      { t: 'Experiment tier-1 / subject line on step 1. Start now? (y/N) y', m: 'Start now? (y/N) y', tone: 'plain' },
      { t: '✓ Started. First sends can wait up to 30 min for provider lookups.', m: '✓ Started. Lookups can take 30 min.', tone: 'fox' },
    ],
  },
  {
    cmd: '/cold learn',
    out: [
      { t: 'tier-1 / subject line, step 1, read after 7 days', m: 'tier-1 / subject line, day 7', tone: 'head' },
      { t: 'A  statement   412 sent   9 interested   2.2%', m: 'A  412 sent   9 interested  2.2%', tone: 'plain' },
      { t: 'B  question    405 sent  21 interested   5.2%', m: 'B  405 sent  21 interested  5.2%', tone: 'plain' },
      { t: '+3.0pp, 95% CI [0.4, 5.6], p=0.02  ->  winner: B', m: '+3.0pp, p=0.02  ->  winner: B', tone: 'fox' },
      { t: 'Proposed: .cold/proposed-diff.patch (Sequence > 1. Opener > Subject)', m: 'Proposed: .cold/proposed-diff.patch', tone: 'plain' },
      { t: 'Apply with git apply, or reject. Nothing changed until you say so.', m: 'Apply or reject. Nothing changes yet.', tone: 'dim' },
    ],
  },
]

const TONE: Record<NonNullable<Line['tone']>, string> = {
  head: 'text-white',
  ok: 'text-white/80',
  fox: 'text-[#FF9A5C]',
  plain: 'text-white/75',
  dim: 'text-white/45',
}

function Mark({ text }: { text: string }) {
  return text.startsWith('✓ ') ? <><span className="text-[#4ADE80]">✓</span>{text.slice(1)}</> : <>{text}</>
}

function Prompt({ text, cursor }: { text: string; cursor?: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[#FF9A5C]">❯</span>
      <span className="text-white">{text}</span>
      {cursor && <span className="inline-block w-[0.55em] h-[1.05em] translate-y-[2px] bg-white/80 animate-blink" aria-hidden />}
    </div>
  )
}

export default function TerminalDemo() {
  // Full session on the server and for reduced motion; animate after mount.
  const [run, setRun] = useState(RUNS.length - 1)
  const [typed, setTyped] = useState<number>(Infinity)
  const [shown, setShown] = useState<number>(Infinity)
  const [animating, setAnimating] = useState(false)
  const [minH, setMinH] = useState<number | undefined>(undefined)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // Hold the height of the full session so the window never jumps while it types.
    if (box.current) setMinH(box.current.offsetHeight)
    setAnimating(true)
    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []
    const wait = (ms: number) => new Promise<void>((r) => timers.push(setTimeout(r, ms)))
    ;(async () => {
      for (let loop = 0; !cancelled; loop++) {
        for (let r = 0; r < RUNS.length && !cancelled; r++) {
          setRun(r); setTyped(0); setShown(0)
          await wait(500)
          for (let i = 1; i <= RUNS[r].cmd.length && !cancelled; i++) { setTyped(i); await wait(55) }
          await wait(350)
          for (let j = 1; j <= RUNS[r].out.length && !cancelled; j++) { setShown(j); await wait(j === 1 ? 380 : 260) }
          await wait(3200)
        }
      }
    })()
    return () => { cancelled = true; timers.forEach(clearTimeout) }
  }, [])

  // While animating, earlier runs stay on screen in full and the current one types.
  const runs = animating ? RUNS.slice(0, run + 1) : RUNS
  return (
    <div ref={box} style={minH ? { minHeight: minH } : undefined} className="font-mono text-[11.5px] leading-[1.7] sm:text-[13.5px] sm:leading-[1.75]" aria-label="Example cold.md session in Claude Code">
      {runs.map((r, idx) => {
        const current = animating && idx === run
        const cmd = current ? r.cmd.slice(0, typed) : r.cmd
        const out = current ? r.out.slice(0, shown) : r.out
        const typing = current && typed < r.cmd.length
        return (
          <div key={r.cmd} className={idx > 0 ? 'mt-4' : ''}>
            <Prompt text={cmd} cursor={typing || (current && shown === 0 && typed >= r.cmd.length)} />
            <div className="mt-1 pl-5">
              {out.map((l, i) => (
                <div key={i} className={`${TONE[l.tone ?? 'plain']} whitespace-pre ${current ? 'animate-rise' : ''}`}>
                  <span className="sm:hidden"><Mark text={l.m ?? l.t} /></span>
                  <span className="hidden sm:inline"><Mark text={l.t} /></span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
