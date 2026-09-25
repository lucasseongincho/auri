// Shared locale helpers (safe on server and client).
export type Locale = 'en' | 'ko'
export const LOCALE_COOKIE = 'auri_lang'

export function parseLocale(value: string | undefined | null): Locale | null {
  return value === 'ko' || value === 'en' ? value : null
}

// Cookie first, then the browser's Accept-Language header, then English.
export function pickLocale(cookieValue: string | undefined, acceptLanguage: string | null): Locale {
  const fromCookie = parseLocale(cookieValue)
  if (fromCookie) return fromCookie
  const first = (acceptLanguage ?? '').split(',')[0]?.trim().toLowerCase() ?? ''
  return first.startsWith('ko') ? 'ko' : 'en'
}

export function writeLocaleCookie(locale: Locale) {
  if (typeof document === 'undefined') return
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`
}
