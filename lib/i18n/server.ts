import { cookies, headers } from 'next/headers'
import { LOCALE_COOKIE, pickLocale, type Locale } from './locale'

export async function getRequestLocale(): Promise<Locale> {
  const [c, h] = await Promise.all([cookies(), headers()])
  return pickLocale(c.get(LOCALE_COOKIE)?.value, h.get('accept-language'))
}
