'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { writeLocaleCookie, type Locale } from './locale'
import { ko } from './ko'

type Vars = Record<string, string | number>
type Translate = (text: string, vars?: Vars) => string

type LocaleContextValue = { locale: Locale; setLocale: (l: Locale) => void; t: Translate }

// English source strings are the keys; ko.ts maps them to Korean.
// A missing key falls back to the English text, so nothing ever renders blank.
function translate(locale: Locale, text: string, vars?: Vars): string {
  let out = locale === 'ko' ? ko[text] ?? text : text
  if (vars) {
    for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v))
  }
  return out
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: (text, vars) => translate('en', text, vars),
})

export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((l: Locale) => {
    writeLocaleCookie(l)
    setLocaleState(l)
  }, [])

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, t: (text, vars) => translate(locale, text, vars) }),
    [locale, setLocale],
  )

  return (
    <LocaleContext.Provider value={value}>
      <div lang={locale} className={locale === 'ko' ? 'contents [word-break:keep-all]' : 'contents'}>
        {children}
      </div>
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  return useContext(LocaleContext)
}

export function useT(): Translate {
  return useContext(LocaleContext).t
}

// Remembers the language a visitor chose on the landing page.
export function RememberLocale({ locale }: { locale: Locale }) {
  useEffect(() => {
    writeLocaleCookie(locale)
  }, [locale])
  return null
}
