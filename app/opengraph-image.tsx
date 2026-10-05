import { renderOgCard, OG_SIZE } from '@/lib/og/card'

export const alt = 'AURI. Not a score. A system. Resume, cover letter and interview prep, tailored to each job post.'
export const size = OG_SIZE
export const contentType = 'image/png'

export default function Image() {
  return renderOgCard('en', 'highlight')
}
