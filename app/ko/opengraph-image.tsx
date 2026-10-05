import { renderOgCard, OG_SIZE } from '@/lib/og/card'

export const alt = 'AURI. Not a score. A system. 해외 취업, 공고 하나로 이력서부터 면접까지.'
export const size = OG_SIZE
export const contentType = 'image/png'

export default function Image() {
  return renderOgCard('ko', 'highlight')
}
