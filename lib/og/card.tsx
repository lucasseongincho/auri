import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'
import type { Lang } from '@/components/landing/copy'

// Shared Open Graph / Twitter card for / and /ko.
// Brand mark, wordmark and slogan, centered so platforms that crop the
// image (square or 2:1 thumbnails) still show all of it.
// Rendered at build time (no request data), so reading fonts from disk is fine.

export const OG_SIZE = { width: 1200, height: 630 }

export type OgVariant = 'minimal' | 'descriptor' | 'highlight'

const C = {
  paper: '#F4F2EC',
  ink: '#1B1D1C',
  body: '#3C403E',
  muted: '#5A5F5C',
  pine: '#1F5C4A',
  mark: '#F2D45C',
}

const FONT_DIR = path.join(process.cwd(), 'node_modules/pretendard/dist/public/static/alternative')

async function loadFonts() {
  const [regular, medium, semibold] = await Promise.all(
    ['Regular', 'Medium', 'SemiBold'].map((w) => readFile(path.join(FONT_DIR, `Pretendard-${w}.ttf`))),
  )
  return [
    { name: 'Pretendard', data: regular, weight: 400 as const, style: 'normal' as const },
    { name: 'Pretendard', data: medium, weight: 500 as const, style: 'normal' as const },
    { name: 'Pretendard', data: semibold, weight: 600 as const, style: 'normal' as const },
  ]
}

const SLOGAN = ['Not a score.', 'A system.'] as const

const DESCRIPTOR: Record<Lang, { line: string; url: string }> = {
  en: { line: 'Resume, cover letter and interview prep, tailored to each job post.', url: 'auri-resume.com' },
  ko: { line: '해외 취업, 공고 하나로 이력서부터 면접까지.', url: 'auri-resume.com/ko' },
}

function LogoMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <rect width="32" height="32" rx="6" fill={C.pine} />
      <g fill="none" stroke={C.paper} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 6l6.5 11L20 23.5h-8L9.5 17zM16 6v7" />
        <circle cx="16" cy="15.5" r="1.5" />
      </g>
    </svg>
  )
}

export async function renderOgCard(lang: Lang, variant: OgVariant = 'descriptor') {
  const d = DESCRIPTOR[lang]
  const withDetails = variant !== 'minimal'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: C.paper,
          fontFamily: 'Pretendard',
          color: C.ink,
          position: 'relative',
        }}
      >
        {/* Mark + wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <LogoMark size={withDetails ? 104 : 120} />
          <span
            style={{
              fontSize: withDetails ? 128 : 148,
              fontWeight: 600,
              letterSpacing: '0.04em',
              lineHeight: 1,
            }}
          >
            AURI
          </span>
        </div>

        {/* Slogan */}
        <div
          style={{
            display: 'flex',
            gap: 14,
            marginTop: withDetails ? 40 : 48,
            fontSize: withDetails ? 46 : 52,
            fontWeight: 500,
            letterSpacing: '-0.01em',
          }}
        >
          <span style={{ color: C.muted }}>{SLOGAN[0]}</span>
          <span
            style={{
              color: C.ink,
              fontWeight: 600,
              ...(variant === 'highlight'
                ? { background: C.mark, padding: '0 10px', borderRadius: 6 }
                : {}),
            }}
          >
            {SLOGAN[1]}
          </span>
        </div>

        {withDetails && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 40 }}>
            <div style={{ width: 56, height: 3, background: C.pine }} />
            <span style={{ marginTop: 28, fontSize: 28, color: C.body }}>{d.line}</span>
          </div>
        )}

        {withDetails && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 44,
              display: 'flex',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 500,
              color: C.pine,
              letterSpacing: '0.02em',
            }}
          >
            {d.url}
          </div>
        )}
      </div>
    ),
    { ...OG_SIZE, fonts: await loadFonts() },
  )
}
