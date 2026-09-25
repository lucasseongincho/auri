import type { Metadata } from 'next'
import '@fontsource/noto-serif-kr/500.css'
import '@fontsource/noto-serif-kr/600.css'
import '@fontsource/ibm-plex-sans-kr/400.css'
import '@fontsource/ibm-plex-sans-kr/500.css'
import '@fontsource/ibm-plex-sans-kr/600.css'
import Landing from '@/components/landing/Landing'
import { ko } from '@/components/landing/copy'

const title = 'AURI — 해외 취업을 위한 영문 이력서 · 커버레터 · 영어 면접 준비'
const description =
  '지원할 해외 채용 공고를 붙여넣으면 그 공고에 맞춘 영문 이력서를 만들고, 빠진 키워드와 ATS 일치도를 보여 줍니다. 커버레터와 영어 면접 준비까지 한곳에서.'

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: {
    canonical: 'https://www.auri-resume.com/ko',
    languages: {
      en: 'https://www.auri-resume.com',
      ko: 'https://www.auri-resume.com/ko',
    },
  },
  openGraph: {
    title,
    description,
    type: 'website',
    siteName: 'AURI',
    locale: 'ko_KR',
    url: 'https://www.auri-resume.com/ko',
  },
  twitter: { card: 'summary_large_image', title, description },
}

export default function KoreanLandingPage() {
  return <Landing c={ko} />
}
