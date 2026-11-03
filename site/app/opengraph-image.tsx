import { ImageResponse } from 'next/og'

export const alt = 'cold.md - Cold outreach that improves itself. Open spec and Claude Code plugin by FoxReach.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          backgroundColor: '#FFFFFF',
          backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(234,88,12,0.18), rgba(234,88,12,0) 60%)',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', borderRadius: 999, background: '#FFFFFF', border: '1px solid #EBEBEB', padding: '6px 16px 6px 6px', fontSize: 22, color: '#333333' }}>
            <span style={{ background: '#EA580C', color: '#FFFFFF', borderRadius: 999, padding: '4px 12px', marginRight: 12, fontWeight: 600 }}>v0.3</span>
            Eleven skills, one /cold command
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 104, color: '#000000', lineHeight: 1.0, letterSpacing: '-0.045em', fontWeight: 700 }}>Cold outreach that</div>
          <div style={{ fontSize: 104, color: '#EA580C', lineHeight: 1.05, letterSpacing: '-0.03em', fontStyle: 'italic', fontWeight: 400 }}>improves itself.</div>
          <div style={{ marginTop: 24, fontSize: 30, color: '#333333', maxWidth: 900 }}>
            One markdown file defines your outbound. Claude Code runs it, tests it and edits it.
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 24, color: '#666666' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: '#000000', fontWeight: 600 }}>
            <div style={{ display: 'flex', width: 44, height: 44, borderRadius: 11, background: '#000000', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: 28 }}>#</div>
            cold.md
          </div>
          <div style={{ display: 'flex' }}>Open spec + Claude Code plugin, by FoxReach</div>
        </div>
      </div>
    ),
    { ...size },
  )
}
