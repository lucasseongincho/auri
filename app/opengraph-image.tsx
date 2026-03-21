import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'
export const alt = 'AURI — AI-Powered Career Toolkit'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Design tokens matching CLAUDE.md Supanova design system
const COLORS = {
  bg: '#0A0A0F',
  surface: '#13131A',
  surfaceElevated: '#1C1C26',
  indigo: '#6366F1',
  indigoLight: '#818CF8',
  violet: '#8B5CF6',
  textPrimary: '#F8F8FF',
  textSecondary: '#A0A0B8',
  textMuted: '#60607A',
  border: 'rgba(255,255,255,0.08)',
}

// Feature pills shown on the card
const FEATURES = [
  'Resume Builder',
  'ATS Optimizer',
  'Cover Letter',
  'Interview Prep',
  'LinkedIn Rewriter',
]

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          background: COLORS.bg,
          padding: '72px 88px',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* ── Background glow blobs ── */}
        <div
          style={{
            position: 'absolute',
            top: '-160px',
            right: '-80px',
            width: '580px',
            height: '580px',
            background:
              'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.22) 0%, rgba(99,102,241,0.06) 45%, transparent 70%)',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-180px',
            left: '180px',
            width: '460px',
            height: '460px',
            background:
              'radial-gradient(circle at 50% 50%, rgba(139,92,246,0.14) 0%, transparent 65%)',
            borderRadius: '50%',
          }}
        />
        {/* Thin indigo rule at top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: `linear-gradient(to right, ${COLORS.indigo}, ${COLORS.violet}, transparent)`,
          }}
        />

        {/* ── Logo row ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '44px',
          }}
        >
          {/* Logo mark — gradient square with sparkle char */}
          <div
            style={{
              width: '54px',
              height: '54px',
              background: `linear-gradient(135deg, ${COLORS.indigo}, ${COLORS.violet})`,
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 8px 32px rgba(99,102,241,0.4)`,
            }}
          >
            <span style={{ color: 'white', fontSize: '26px', lineHeight: '1' }}>✦</span>
          </div>

          {/* Wordmark */}
          <span
            style={{
              color: COLORS.textPrimary,
              fontSize: '38px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
            }}
          >
            AURI
          </span>

          {/* Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(99,102,241,0.12)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: '100px',
              padding: '6px 14px',
              marginLeft: '4px',
            }}
          >
            <span
              style={{
                color: COLORS.indigoLight,
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              AI Career Toolkit
            </span>
          </div>
        </div>

        {/* ── Headline ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginBottom: '28px',
          }}
        >
          <span
            style={{
              color: COLORS.textPrimary,
              fontSize: '66px',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: '1.05',
            }}
          >
            Land your next job
          </span>
          <span
            style={{
              color: COLORS.indigo,
              fontSize: '66px',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: '1.05',
            }}
          >
            with AI.
          </span>
        </div>

        {/* ── Subtitle ── */}
        <p
          style={{
            color: COLORS.textSecondary,
            fontSize: '22px',
            lineHeight: '1.55',
            margin: '0 0 48px 0',
            maxWidth: '640px',
          }}
        >
          ATS-optimized resumes, cover letters, LinkedIn rewrites, and interview
          prep — all powered by Claude AI.
        </p>

        {/* ── Feature pills ── */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {FEATURES.map((f) => (
            <div
              key={f}
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '100px',
                padding: '9px 18px',
                color: COLORS.textSecondary,
                fontSize: '15px',
                fontWeight: 500,
              }}
            >
              {f}
            </div>
          ))}
        </div>

        {/* ── Bottom-right URL ── */}
        <span
          style={{
            position: 'absolute',
            bottom: '48px',
            right: '88px',
            color: COLORS.textMuted,
            fontSize: '17px',
            letterSpacing: '0.02em',
          }}
        >
          auri-beta.vercel.app
        </span>
      </div>
    ),
    size,
  )
}
