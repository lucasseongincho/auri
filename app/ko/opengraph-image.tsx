import { renderOgCard, OG_SIZE } from '@/lib/og/card'

export const alt = 'AURI: 공고를 붙여넣으면 맞춤 영문 이력서가 나옵니다'
export const size = OG_SIZE
export const contentType = 'image/png'

export default function Image() {
  return renderOgCard('ko')
}
