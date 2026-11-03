'use client'

import { useState } from 'react'

type Props = {
  text: string
  label?: string
  className?: string
  variant?: 'light' | 'dark'
}

export default function CopyButton({ text, label = 'Copy', className = '', variant = 'light' }: Props) {
  const [copied, setCopied] = useState(false)

  const onCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        ta.remove()
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* the user can still select the text by hand */
    }
  }

  const tone =
    variant === 'dark'
      ? 'text-white/70 hover:text-white border-white/15 hover:border-white/30 bg-white/5'
      : 'text-ink-3 hover:text-ink border-line hover:border-ink/20 bg-white'

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={copied ? 'Copied' : `${label}: ${text}`}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${tone} ${className}`}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      <span>{copied ? 'Copied' : label}</span>
    </button>
  )
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden>
      <path d="M10 2H4a1 1 0 0 0-1 1v9" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <rect x="6" y="5" width="8" height="9" rx="1.25" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden>
      <path d="M3 8.5l3.2 3.2L13 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
