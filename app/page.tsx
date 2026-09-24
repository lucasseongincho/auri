import Link from 'next/link'
import '@fontsource-variable/newsreader/wght.css'
import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import LandingNav from '@/components/landing/LandingNav'
import StartLink from '@/components/landing/StartLink'
import TailorDemo from '@/components/landing/TailorDemo'
import Pricing from '@/components/landing/Pricing'

// Landing page. Its look is self-contained (lp-* tokens in tailwind.config.ts)
// and intentionally separate from the dashboard's design system.

type Testimonial = { quote: string; name: string; role: string; outcome: string }

// TODO(입력 필요): one real quote, published with the person's consent.
// The section stays hidden until this is filled in. Do not invent one.
const TESTIMONIAL: Testimonial | null = null

const eyebrow = 'font-lp-mono text-xs uppercase tracking-[0.08em] text-lp-muted md:text-[13px]'
const shell = 'mx-auto w-full max-w-[1200px]'
const gutter = 'px-4 md:px-8 xl:px-0'

const STEPS: {
  n: string
  id?: string
  title: string
  body: string
  pro?: boolean
  link: { label: string; href: string }
  example: React.ReactNode
}[] = [
  {
    n: '01',
    id: 'ats',
    title: 'Tailor the resume',
    body: 'Paste your current resume or fill in your background, then add the job post. AURI writes a version for that role and scores the match in real time.',
    link: { label: 'Open the resume builder', href: '/dashboard/resume' },
    example: (
      <div className="flex flex-col gap-3.5">
        <div className="flex justify-between text-sm">
          <span>ATS match</span>
          <span className="font-lp-mono">87 / 100</span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-lp-control bg-lp-hairline"
          role="img"
          aria-label="Sample ATS match score, 87 out of 100"
        >
          <div className="h-full w-[87%] bg-lp-pine" />
        </div>
        <p className="text-sm text-lp-muted">Formatted for Workday, Greenhouse, Lever and iCIMS.</p>
      </div>
    ),
  },
  {
    n: '02',
    title: 'Fix it line by line',
    body: 'Easy Tune lets you edit inline and rewrite a single bullet without touching the rest. Keep what reads like you, discard what does not.',
    link: { label: 'Try Easy Tune', href: '/dashboard/resume' },
    example: (
      <div className="flex flex-col gap-2.5 text-[15px] leading-relaxed">
        <p className="text-lp-muted">Led migration of reporting from Excel to a shared database.</p>
        <p className="-mx-3 rounded-lp-control bg-lp-paper px-3 py-2">
          Moved the team&apos;s weekly reporting from Excel files to a shared SQL database, removing manual copy-paste.
        </p>
        <p className="text-lp-muted">Presented monthly results to regional managers.</p>
      </div>
    ),
  },
  {
    n: '03',
    title: 'Write the cover letter',
    body: 'A 280 to 300 word letter built from the same resume and posting, so the two tell one story.',
    link: { label: 'Open the cover letter generator', href: '/dashboard/cover-letter' },
    example: (
      <div className="flex flex-col gap-3">
        <p className="font-lp-serif text-lg leading-relaxed">
          Dear Hiring Team, your posting asks for someone who can turn order data into decisions sales can act on. For
          the past two years that has been most of my week.
        </p>
        <p className="font-lp-mono text-[13px] text-lp-muted">Sample opening, full letter 280–300 words</p>
      </div>
    ),
  },
  {
    n: '04',
    title: 'Prepare for the interview',
    body: 'Eight questions you are likely to be asked for this role, each with a STAR outline drawn from your own experience, as flip cards.',
    pro: true,
    link: { label: 'Open interview prep', href: '/dashboard/interview' },
    example: (
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_200px]">
        <div className="flex flex-col gap-2">
          <p className="font-lp-mono text-[13px] text-lp-muted">Question 3 of 8</p>
          <p className="text-[17px] font-medium leading-normal">
            Tell me about a time your analysis changed a stakeholder&apos;s decision.
          </p>
        </div>
        <dl className="m-0 grid grid-cols-[24px_minmax(0,1fr)] content-start gap-x-2 gap-y-1.5 text-sm">
          {['Situation', 'Task', 'Action', 'Result'].map((w) => (
            <div key={w} className="contents">
              <dt className="font-lp-mono text-lp-pine">{w[0]}</dt>
              <dd className="m-0">{w}</dd>
            </div>
          ))}
        </dl>
      </div>
    ),
  },
]

const ALSO_PRO: { title: string; body: string; href: string }[] = [
  {
    title: 'LinkedIn Rewriter',
    body: 'Rewrites your profile so recruiters searching for the role can find it.',
    href: '/dashboard/linkedin',
  },
  {
    title: '7-Day Job Strategy',
    body: 'A personal, day-by-day plan for the week of your search.',
    href: '/dashboard/strategy',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-lp-paper font-lp-sans text-lp-ink antialiased [&_a:focus-visible]:outline [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-[3px] [&_a:focus-visible]:outline-lp-pine [&_button:focus-visible]:outline [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-[3px] [&_button:focus-visible]:outline-lp-pine">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lp-control focus:bg-white focus:px-4 focus:py-3"
      >
        Skip to content
      </a>
      <LandingNav />

      <main id="main">
        {/* Hero: the offer, and the product doing it */}
        <section className={`${gutter} pb-12 pt-10 lg:pb-28 lg:pt-24`}>
          <div className={`${shell} grid items-start gap-8 lg:grid-cols-[500px_minmax(0,1fr)] lg:gap-[72px]`}>
            <div className="flex flex-col gap-5 lg:gap-7 lg:pt-6">
              <p className={eyebrow}>Resume, cover letter, interview prep</p>
              <h1 className="text-balance font-lp-serif text-[40px] font-medium leading-[1.08] tracking-[-0.01em] lg:text-[64px] lg:leading-[1.04] lg:tracking-[-0.015em]">
                Paste the job post. Get a resume written for it.
              </h1>
              <p className="max-w-[460px] text-[17px] leading-relaxed text-lp-body lg:text-[19px]">
                AURI reads the posting, rewrites your resume to match it, and shows which keywords are still missing before
                you apply.
              </p>
              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:gap-6 lg:pt-2">
                <StartLink
                  intent="free"
                  className="flex min-h-[52px] items-center justify-center rounded-lp-control bg-lp-pine px-7 text-[17px] font-medium text-white no-underline hover:bg-lp-pine-dark hover:text-white"
                >
                  Start free
                </StartLink>
                <Link
                  href="/login"
                  className="flex min-h-[44px] items-center justify-center text-base text-lp-pine underline underline-offset-4 hover:text-lp-pine-dark"
                >
                  Upload an existing resume
                </Link>
              </div>
              <p className="text-center text-sm text-lp-muted sm:text-left">
                Free plan includes 3 AI generations a month. No credit card required.
              </p>
            </div>
            <TailorDemo />
          </div>
        </section>

        {/* How it works: one application, start to finish */}
        <section id="how-it-works" className={`${gutter} border-t border-lp-rule py-12 lg:pb-24 lg:pt-[104px]`}>
          <div className={`${shell} flex flex-col gap-7 lg:gap-16`}>
            <div id="features" className="grid gap-3 lg:grid-cols-[500px_minmax(0,1fr)] lg:items-end lg:gap-[72px]">
              <h2 className="text-balance font-lp-serif text-[32px] font-medium leading-[1.15] lg:text-5xl lg:leading-[1.1]">
                One job post, from resume to interview.
              </h2>
              <p className="max-w-[560px] text-base leading-relaxed text-lp-body lg:text-lg">
                Everything below works from the same two inputs: your background and the posting you are applying to. You
                add them once.
              </p>
            </div>

            <ol className="m-0 flex list-none flex-col p-0">
              {STEPS.map((s, i) => (
                <li
                  key={s.n}
                  id={s.id}
                  className={`grid gap-2.5 border-t py-6 lg:grid-cols-[72px_428px_minmax(0,1fr)] lg:gap-x-[72px] lg:gap-y-0 lg:py-10 ${
                    i === 0 ? 'border-lp-ink' : 'border-lp-rule'
                  } ${i === STEPS.length - 1 ? 'border-b border-b-lp-rule' : ''}`}
                >
                  <p className="font-lp-mono text-sm text-lp-muted lg:text-[15px]">{s.n}</p>
                  <div className="flex flex-col items-start gap-2.5 lg:gap-3">
                    <h3 className="flex items-baseline gap-3 text-[21px] font-semibold lg:text-2xl">
                      {s.title}
                      {s.pro && (
                        <span className="font-lp-mono text-xs font-normal uppercase tracking-[0.08em] text-lp-pine">
                          Pro
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
                    {s.example}
                  </div>
                </li>
              ))}
            </ol>

            <div className="grid gap-4 lg:grid-cols-[572px_minmax(0,1fr)_minmax(0,1fr)] lg:gap-x-12">
              <p className="text-sm text-lp-muted lg:pt-1 lg:text-[15px]">Also in Pro, for the search as a whole</p>
              {ALSO_PRO.map((f) => (
                <div key={f.title} className="flex flex-col">
                  <h3 className="text-[17px] font-semibold lg:text-lg">
                    <Link href={f.href} className="inline-flex min-h-[44px] items-center text-lp-ink no-underline hover:text-lp-pine hover:underline">
                      {f.title}
                    </Link>
                  </h3>
                  <p className="text-[15px] leading-relaxed text-lp-body">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {TESTIMONIAL && (
          <section aria-label="What users say" className={`${gutter} bg-lp-sunk py-10 lg:py-[88px]`}>
            <div className={`${shell} grid gap-4 lg:grid-cols-[500px_minmax(0,1fr)] lg:gap-[72px]`}>
              <p className={`${eyebrow} lg:pt-2.5`}>From someone who used it</p>
              <figure className="m-0 flex flex-col gap-4 lg:gap-5">
                <blockquote className="m-0 font-lp-serif text-[22px] leading-[1.4] lg:text-[30px] lg:leading-[1.35]">
                  {TESTIMONIAL.quote}
                </blockquote>
                <figcaption className="text-sm text-lp-body lg:text-[15px]">
                  {TESTIMONIAL.name} · {TESTIMONIAL.role} · {TESTIMONIAL.outcome}
                </figcaption>
              </figure>
            </div>
          </section>
        )}

        <Pricing />
      </main>

      <footer className={`${gutter} border-t border-lp-rule pb-10 pt-8 lg:pb-14 lg:pt-12`}>
        <div className={`${shell} flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-12`}>
          <div className="flex flex-col gap-1.5 lg:gap-2.5">
            <p className="font-lp-serif text-xl font-semibold tracking-[0.06em] lg:text-[22px]">AURI</p>
            <p className="text-sm text-lp-muted">AI features run on Anthropic&apos;s Claude.</p>
            <p className="text-sm text-lp-muted">© 2026 AURI</p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-4 text-[15px] lg:flex lg:gap-8">
            {[
              { label: 'Blog', href: '/blog' },
              { label: 'Contact', href: '/contact' },
              { label: 'Terms of Service', href: '/terms' },
              { label: 'Privacy Policy', href: '/privacy' },
            ].map((l) => (
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
