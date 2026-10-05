import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'
import { en, ko, DEMO_KEYWORDS, type Lang } from '@/components/landing/copy'

// Shared Open Graph / Twitter card for / and /ko.
// Same system as the landing page: paper, ink, pine, highlight only on
// matched keywords, single-border panel, Pretendard.
// Rendered at build time (no request data), so reading fonts from disk is fine.

export const OG_SIZE = { width: 1200, height: 630 }

const C = {
  paper: '#F4F2EC',
  sheet: '#FAF9F5',
  white: '#FFFFFF',
  rule: '#D9D5CC',
  hairline: '#E6E2D9',
  ink: '#1B1D1C',
  body: '#3C403E',
  muted: '#5A5F5C',
  pine: '#1F5C4A',
  mark: '#F2D45C',
  miss: '#9A3B12',
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

const TEXT: Record<Lang, { headline: string[]; sub: string; url: string }> = {
  en: {
    headline: ['Paste the job post.', 'Get a resume', 'written for it.'],
    sub: 'Resume, cover letter and interview prep, tailored to one job post.',
    url: 'auri-resume.com',
  },
  ko: {
    headline: ['공고를 붙여넣으면', '맞춤 영문 이력서가', '나옵니다.'],
    sub: '해외 취업 · 영문 이력서 · 커버레터 · 영어 면접 준비',
    url: 'auri-resume.com/ko',
  },
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

export async function renderOgCard(lang: Lang) {
  const copy = lang === 'ko' ? ko : en
  const t = TEXT[lang]
  const d = copy.demo
  const missing = DEMO_KEYWORDS[DEMO_KEYWORDS.length - 1]

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: C.paper,
          fontFamily: 'Pretendard',
          color: C.ink,
          padding: '64px 64px 56px 72px',
        }}
      >
        {/* Left: brand + promise */}
        <div style={{ display: 'flex', flexDirection: 'column', width: 560, height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <LogoMark size={44} />
            <span style={{ fontSize: 34, fontWeight: 600, letterSpacing: '0.06em' }}>AURI</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 56 }}>
            {t.headline.map((line) => (
              <span
                key={line}
                style={{ fontSize: lang === 'ko' ? 58 : 62, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.14 }}
              >
                {line}
              </span>
            ))}
          </div>

          <span style={{ marginTop: 28, fontSize: 24, color: C.body, lineHeight: 1.45, maxWidth: 520 }}>{t.sub}</span>

          <div style={{ display: 'flex', marginTop: 'auto', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 28, height: 3, background: C.pine }} />
            <span style={{ fontSize: 22, fontWeight: 500, color: C.pine }}>{t.url}</span>
          </div>
        </div>

        {/* Right: the product, as on the landing page */}
        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 'auto', width: 500, justifyContent: 'center' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              background: C.white,
              border: `1px solid ${C.rule}`,
              borderRadius: 10,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '18px 24px',
                borderBottom: `1px solid ${C.hairline}`,
                fontSize: 17,
              }}
            >
              <span style={{ fontWeight: 500 }}>{`${d.tailoringFor}${d.role}`}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.muted }}>
                <span>{d.atsShort}</span>
                <span style={{ textDecoration: 'line-through' }}>61</span>
                <span style={{ color: C.ink, fontWeight: 600 }}>87</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', padding: '20px 24px 24px', gap: 10 }}>
              <span style={{ fontSize: 14, color: C.muted }}>{d.before}</span>
              <span style={{ fontSize: 18, color: C.muted, textDecoration: 'line-through', lineHeight: 1.45 }}>
                {d.beforeText}
              </span>

              <span style={{ fontSize: 14, color: C.muted, marginTop: 8 }}>{d.after}</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', fontSize: 19, lineHeight: 1.6, color: C.ink }}>
                {d.afterHtml.flatMap((part, i) =>
                  part.mark
                    ? [
                        <span key={i} style={{ background: C.mark, padding: '0 4px', borderRadius: 3, marginRight: 5 }}>
                          {part.text}
                        </span>,
                      ]
                    : part.text
                        .trim()
                        .split(' ')
                        .filter(Boolean)
                        .map((w, j) => (
                          <span key={`${i}-${j}`} style={{ marginRight: 5 }}>
                            {w}
                          </span>
                        )),
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', marginTop: 12, borderTop: `1px solid ${C.hairline}` }}>
                {DEMO_KEYWORDS.map((k) => (
                  <div
                    key={k}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 16,
                      padding: '8px 0',
                      borderBottom: `1px solid ${C.hairline}`,
                    }}
                  >
                    <span>{k}</span>
                    <span style={{ color: k === missing ? C.miss : C.pine, fontWeight: 500 }}>
                      {k === missing ? d.missing : d.found}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <span style={{ marginTop: 12, fontSize: 15, color: C.muted }}>{d.caption}</span>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await loadFonts() },
  )
}
