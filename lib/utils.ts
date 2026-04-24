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

export function formatResumeDate(
  value: unknown,
  prefix: string = 'Updated'
): string {
  const date = toDate(value)
  if (!date) return 'Date unavailable'
  const formatted = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return prefix ? `${prefix} ${formatted}` : formatted
}
