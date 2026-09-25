// Firestore Timestamp shape (subset we need)
interface FirestoreTimestamp {
  seconds: number
  toDate?(): Date
}

function isTimestamp(val: unknown): val is FirestoreTimestamp {
  return typeof val === 'object' && val !== null && 'seconds' in val
}

export function toDate(value: unknown): Date | null {
  if (!value) return null
  if (isTimestamp(value)) {
    return typeof value.toDate === 'function'
      ? value.toDate()
      : new Date(value.seconds * 1000)
  }
  if (value instanceof Date) return value
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value)
    return isNaN(d.getTime()) ? null : d
  }
  return null
}

const KO_PREFIX: Record<string, string> = { Updated: '수정', Saved: '저장' }

export function formatResumeDate(
  value: unknown,
  prefix: string = 'Updated',
  locale: 'en' | 'ko' = 'en'
): string {
  const date = toDate(value)
  if (!date) return locale === 'ko' ? '날짜 정보 없음' : 'Date unavailable'
  if (locale === 'ko') {
    const formatted = date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    const p = prefix ? KO_PREFIX[prefix] ?? prefix : ''
    return p ? `${formatted} ${p}` : formatted
  }
  const formatted = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return prefix ? `${prefix} ${formatted}` : formatted
}
