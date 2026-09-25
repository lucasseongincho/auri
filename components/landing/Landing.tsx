import Link from 'next/link'
import LandingNav from './LandingNav'
import StartLink from './StartLink'
import TailorDemo from './TailorDemo'
import Pricing from './Pricing'
import type { LandingCopy, Step } from './copy'

// Landing page layout shared by / (English) and /ko (Korean).
// Copy lives in ./copy.ts; the look comes from the lp-* tokens.

type Testimonial = { quote: string; name: string; role: string; outcome: string }

// TODO(입력 필요): one real quote per language, published with the person's consent.
// Each section stays hidden until filled in. Do not invent one.
const TESTIMONIALS: Record<LandingCopy['lang'], Testimonial | null> = { en: null, ko: null }

const eyebrow = 'font-lp-mono text-xs uppercase tracking-[0.08em] text-lp-muted md:text-[13px]'
const shell = 'mx-auto w-full max-w-[1200px]'
const gutter = 'px-4 md:px-8 xl:px-0'

function StepExample({ ex }: { ex: Step['example'] }) {
  switch (ex.kind) {
    case 'score':
      return (
        <div className="flex flex-col gap-3.5">
          <div className="flex justify-between text-sm">
            <span>{ex.label}</span>
            <span className="font-lp-mono">{ex.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-lp-control bg-lp-hairline" role="img" aria-label={ex.ariaLabel}>
            <div className="h-full w-[87%] bg-lp-pine" />
          </div>
          <p className="text-sm text-lp-muted">{ex.note}</p>
        </div>
      )
    case 'tune':
      return (
        <div lang="en" className="flex flex-col gap-2.5 text-[15px] leading-relaxed">
          <p className="text-lp-muted">{ex.before}</p>
          <p className="-mx-3 rounded-lp-control bg-lp-paper px-3 py-2">{ex.active}</p>
          <p className="text-lp-muted">{ex.after}</p>
        </div>
      )
    case 'letter':
      return (
        <div className="flex flex-col gap-3">
          <p lang="en" className="font-lp-serif text-lg leading-relaxed">
            {ex.text}
          </p>
          <p className="font-lp-mono text-[13px] text-lp-muted">{ex.caption}</p>
        </div>
      )
    case 'interview':
      return (
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_200px]">
          <div className="flex flex-col gap-2">
            <p className="font-lp-mono text-[13px] text-lp-muted">{ex.counter}</p>
            <p lang="en" className="text-[17px] font-medium leading-normal">
              {ex.question}
            </p>
          </div>
          <dl className="m-0 grid grid-cols-[24px_minmax(0,1fr)] content-start gap-x-2 gap-y-1.5 text-sm">
            {(['S', 'T', 'A', 'R'] as const).map((letter, i) => (
              <div key={letter} className="contents">
                <dt className="font-lp-mono text-lp-pine">{letter}</dt>
                <dd className="m-0">{ex.star[i]}</dd>
              </div>
            ))}
          </dl>
        </div>
      )
  }
}

export default function Landing({ c }: { c: LandingCopy }) {
  const testimonial = TESTIMONIALS[c.lang]
  const homeHref = c.lang === 'ko' ? '/ko' : '/'
  // Korean: keep words whole when lines wrap, the way Korean readers expect.
  const langClass = c.lang === 'ko' ? '[word-break:keep-all] [&_.font-lp-mono]:tracking-normal' : ''

  return (
    <div
      lang={c.lang}
      className={`min-h-screen overflow-x-hidden bg-lp-paper font-lp-sans text-lp-ink antialiased ${langClass} [&_a:focus-visible]:outline [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-[3px] [&_a:focus-visible]:outline-lp-pine [&_button:focus-visible]:outline [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-[3px] [&_button:focus-visible]:outline-lp-pine`}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lp-control focus:bg-white focus:px-4 focus:py-3"
      >
        {c.skip}
      </a>
      <LandingNav c={c.nav} homeHref={homeHref} />

      <main id="main">
        {/* Hero: the offer, and the product doing it */}
        <section className={`${gutter} pb-12 pt-10 lg:pb-28 lg:pt-24`}>
          <div className={`${shell} grid items-start gap-8 lg:grid-cols-[500px_minmax(0,1fr)] lg:gap-[72px]`}>
            <div className="flex flex-col gap-5 lg:gap-7 lg:pt-6">
              <p className={eyebrow}>{c.hero.eyebrow}</p>
              <h1
                className={`whitespace-pre-line text-balance font-lp-serif font-medium ${
                  c.lang === 'ko'
                    ? 'text-[34px] leading-[1.25] tracking-[-0.02em] lg:text-[52px] lg:leading-[1.2]'
                    : 'text-[40px] leading-[1.08] tracking-[-0.01em] lg:text-[64px] lg:leading-[1.04] lg:tracking-[-0.015em]'
                }`}
              >
                {c.hero.title}
              </h1>
              <p className="max-w-[460px] text-[17px] leading-relaxed text-lp-body lg:text-[19px]">{c.hero.body}</p>
              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:gap-6 lg:pt-2">
                <StartLink
                  intent="free"
                  className="flex min-h-[52px] items-center justify-center rounded-lp-control bg-lp-pine px-7 text-[17px] font-medium text-white no-underline hover:bg-lp-pine-dark hover:text-white"
                >
                  {c.hero.cta}
                </StartLink>
                <Link
                  href="/login"
                  className="flex min-h-[44px] items-center justify-center text-base text-lp-pine underline underline-offset-4 hover:text-lp-pine-dark"
                >
                  {c.hero.upload}
                </Link>
              </div>
              <p className="text-center text-sm text-lp-muted sm:text-left">{c.hero.note}</p>
            </div>
            <TailorDemo c={c.demo} />
          </div>
        </section>

        {/* Korean page only: how applying abroad differs from applying at home */}
        {c.differences && (
          <section aria-labelledby="differences" className={`${gutter} border-t border-lp-rule py-12 lg:py-24`}>
            <div className={`${shell} flex flex-col gap-7 lg:gap-12`}>
              <div className="grid gap-3 lg:grid-cols-[500px_minmax(0,1fr)] lg:items-end lg:gap-[72px]">
                <h2
                  id="differences"
                  className="text-balance font-lp-serif text-[28px] font-medium leading-[1.3] tracking-[-0.02em] lg:text-[40px] lg:leading-[1.25]"
                >
                  {c.differences.title}
                </h2>
                <p className="max-w-[560px] text-base leading-relaxed text-lp-body lg:text-lg">{c.differences.body}</p>
              </div>
              <table className="w-full border-collapse text-left text-[15px] lg:text-base">
                <thead className="hidden md:table-header-group">
                  <tr className="border-b border-lp-ink">
                    {c.differences.headers.map((h, i) => (
                      <th
                        key={h}
                        scope="col"
                        className={`py-3 pr-6 font-lp-mono text-xs font-normal uppercase tracking-[0.08em] ${
                          i === 2 ? 'text-lp-pine' : 'text-lp-muted'
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {c.differences.rows.map((r) => (
                    <tr
                      key={r.topic}
                      className="grid gap-1.5 border-b border-lp-rule py-5 md:table-row md:py-0"
                    >
                      <th scope="row" className="font-semibold md:w-[20%] md:py-5 md:pr-6 md:align-top">
                        {r.topic}
                      </th>
                      <td className="text-lp-muted md:w-[36%] md:py-5 md:pr-6 md:align-top">
                        <span className="md:hidden">{c.differences!.mobileLabels[0]} · </span>
                        {r.home}
                      </td>
                      <td className="md:py-5 md:align-top">
                        <span className="font-medium text-lp-pine md:hidden">{c.differences!.mobileLabels[1]} · </span>
                        {r.abroad}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* How it works: one application, start to finish */}
        <section id="how-it-works" className={`${gutter} border-t border-lp-rule py-12 lg:pb-24 lg:pt-[104px]`}>
          <div className={`${shell} flex flex-col gap-7 lg:gap-16`}>
            <div id="features" className="grid gap-3 lg:grid-cols-[500px_minmax(0,1fr)] lg:items-end lg:gap-[72px]">
              <h2
                className={`text-balance font-lp-serif font-medium ${
                  c.lang === 'ko'
                    ? 'text-[28px] leading-[1.3] tracking-[-0.02em] lg:text-[40px] lg:leading-[1.25]'
                    : 'text-[32px] leading-[1.15] lg:text-5xl lg:leading-[1.1]'
                }`}
              >
                {c.how.title}
              </h2>
              <p className="max-w-[560px] text-base leading-relaxed text-lp-body lg:text-lg">{c.how.body}</p>
            </div>

            <ol className="m-0 flex list-none flex-col p-0">
              {c.how.steps.map((s, i) => (
                <li
                  key={s.n}
                  id={s.id}
                  className={`grid gap-2.5 border-t py-6 lg:grid-cols-[72px_428px_minmax(0,1fr)] lg:gap-x-[72px] lg:gap-y-0 lg:py-10 ${
                    i === 0 ? 'border-lp-ink' : 'border-lp-rule'
                  } ${i === c.how.steps.length - 1 ? 'border-b border-b-lp-rule' : ''}`}
                >
                  <p className="font-lp-mono text-sm text-lp-muted lg:text-[15px]">{s.n}</p>
                  <div className="flex flex-col items-start gap-2.5 lg:gap-3">
                    <h3 className="flex items-baseline gap-3 font-lp-sans text-[21px] font-semibold lg:text-2xl">
                      {s.title}
                      {s.pro && (
                        <span className="font-lp-mono text-xs font-normal uppercase tracking-[0.08em] text-lp-pine">
                          {c.how.proBadge}
                        </span>
                      )}
                    </h3>
                    <p className="text-base leading-[1.65] text-lp-body">{s.body}</p>
                    <Link
                      href={s.link.href}
                      className="inline-flex min-h-[44px] items-center text-[15px] text-lp-pine underline underline-offset-4 hover:text-lp-pine-dark"
                    >
                      {s.link.label}
                    </Link>
                  </div>
                  <div className="mt-2 hidden rounded-lp-panel border border-lp-hairline bg-white px-7 py-6 md:block lg:mt-0">
                    <StepExample ex={s.example} />
                  </div>
                </li>
              ))}
            </ol>

            <div className="grid gap-4 lg:grid-cols-[572px_minmax(0,1fr)_minmax(0,1fr)] lg:gap-x-12">
              <p className="text-sm text-lp-muted lg:pt-1 lg:text-[15px]">{c.how.alsoLabel}</p>
              {c.how.also.map((f) => (
                <div key={f.title} className="flex flex-col">
                  <h3 className="font-lp-sans text-[17px] font-semibold lg:text-lg">
                    <Link
                      href={f.href}
                      className="inline-flex min-h-[44px] items-center text-lp-ink no-underline hover:text-lp-pine hover:underline"
                    >
                      {f.title}
                    </Link>
                  </h3>
                  <p className="text-[15px] leading-relaxed text-lp-body">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {testimonial && (
          <section aria-label={c.testimonialLabel} className={`${gutter} bg-lp-sunk py-10 lg:py-[88px]`}>
            <div className={`${shell} grid gap-4 lg:grid-cols-[500px_minmax(0,1fr)] lg:gap-[72px]`}>
              <p className={`${eyebrow} lg:pt-2.5`}>{c.testimonialLabel}</p>
              <figure className="m-0 flex flex-col gap-4 lg:gap-5">
                <blockquote className="m-0 font-lp-serif text-[22px] leading-[1.4] lg:text-[30px] lg:leading-[1.35]">
                  {testimonial.quote}
                </blockquote>
                <figcaption className="text-sm text-lp-body lg:text-[15px]">
                  {testimonial.name} · {testimonial.role} · {testimonial.outcome}
                </figcaption>
              </figure>
            </div>
          </section>
        )}

        <Pricing c={c.pricing} />
      </main>

      <footer className={`${gutter} border-t border-lp-rule pb-10 pt-8 lg:pb-14 lg:pt-12`}>
        <div className={`${shell} flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-12`}>
          <div className="flex flex-col gap-1.5 lg:gap-2.5">
            <p className="font-lp-serif text-xl font-semibold tracking-[0.06em] lg:text-[22px]">AURI</p>
            <p className="text-sm text-lp-muted">{c.footer.poweredBy}</p>
            <p className="text-sm text-lp-muted">{c.footer.copyright}</p>
          </div>
          <nav aria-label={c.footer.label} className="grid grid-cols-2 gap-x-4 text-[15px] lg:flex lg:gap-8">
            {c.footer.links.map((l) => (
              <Link key={l.href} href={l.href} className="flex min-h-[44px] items-center text-lp-pine hover:text-lp-pine-dark">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  )
}
