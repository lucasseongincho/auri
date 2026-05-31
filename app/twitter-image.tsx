import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'AURI — AI-Powered Career Toolkit'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#0A0A0F',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Top gradient accent */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(to right, #6366F1, #8B5CF6)',
          }}
        />

        {/* Centered glow */}
        <div
          style={{
            position: 'absolute',
            width: '700px',
            height: '700px',
            background:
              'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.12) 0%, transparent 65%)',
            borderRadius: '50%',
          }}
        />

        {/* AURI wordmark */}
        <span
          style={{
            color: '#F8F8FF',
            fontSize: '120px',
            fontWeight: 800,
            letterSpacing: '-0.05em',
            lineHeight: 1,
            zIndex: 1,
            marginBottom: '28px',
          }}
        >
          AURI
        </span>

        {/* Subtitle */}
        <span
          style={{
            color: '#A0A0B8',
            fontSize: '30px',
            fontWeight: 500,
            letterSpacing: '0.01em',
            zIndex: 1,
          }}
        >
          Not a score. A system.
        </span>

        {/* Bottom accent dot row */}
        <div
          style={{
            position: 'absolute',
            bottom: '52px',
            display: 'flex',
            gap: '8px',
            zIndex: 1,
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: i === 1 ? '#6366F1' : 'rgba(99,102,241,0.35)',
              }}
            />
          ))}
        </div>
      </div>
    ),
    size,
  )
}
