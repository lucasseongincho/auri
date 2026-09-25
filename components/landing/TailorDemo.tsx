// Static sample of the tailoring flow: job post → keyword check → one
// rewritten bullet → ATS score. It is labelled as a sample on the page.
// TODO: replace with a real screenshot or the real ATSScorePanel output.
import { DEMO_KEYWORDS, type LandingCopy } from './copy'

type Run = { text: string; mark?: boolean }

function Runs({ runs }: { runs: Run[] }) {
  return (
    <>
      {runs.map((r, i) =>
        r.mark ? (
          <mark key={i} className="bg-lp-mark px-0.5 text-lp-ink">
            {r.text}
          </mark>
        ) : (
          <span key={i}>{r.text}</span>
        ),
      )}
    </>
  )
}

const label = 'font-lp-mono text-[11px] uppercase tracking-[0.08em] text-lp-muted md:text-xs'
const FOUND = new Set(['Tableau', 'SQL', 'stakeholders'])

export default function TailorDemo({ c }: { c: LandingCopy['demo'] }) {
  const missing = DEMO_KEYWORDS.filter((k) => !FOUND.has(k))
  return (
    <figure className="m-0 flex flex-col gap-2.5 md:gap-3">
      <div className="overflow-hidden rounded-lp-panel border border-lp-rule bg-white shadow-lp-lift">
        <div className="flex items-center justify-between gap-3 border-b border-lp-hairline px-4 py-3 md:px-6 md:py-3.5">
          <p className="text-[13px] font-medium md:text-sm">
            <span className="hidden md:inline">{c.tailoringFor}</span>
            {c.role}
          </p>
          <p className="whitespace-nowrap font-lp-mono text-xs text-lp-muted md:text-[13px]">
            <span className="hidden font-lp-sans md:inline">{c.atsLong}</span>
            <span className="md:hidden">{c.atsShort}</span>
            <del className="text-lp-muted" aria-label={c.beforeAria}>
              61
            </del>{' '}
            <ins className="font-medium text-lp-pine no-underline" aria-label={c.afterAria}>
              87
            </ins>
          </p>
        </div>

        <div className="grid md:grid-cols-2">
          <div className="flex flex-col gap-2.5 border-b border-lp-hairline bg-lp-sheet p-4 md:gap-3.5 md:border-b-0 md:border-r md:p-6">
            <p className={label}>{c.jobPost}</p>
            <p lang="en" className="text-sm leading-[1.65] text-lp-body md:text-[15px] md:leading-[1.7]">
              <span className="hidden md:inline">
                <Runs runs={c.jobPostHtml} />
              </span>
              <span className="md:hidden">
                <Runs runs={c.jobPostShortHtml} />
              </span>
            </p>
            <ul className="mt-1.5 hidden list-none flex-col gap-2 p-0 text-sm md:flex">
              {DEMO_KEYWORDS.map((k) => (
                <li key={k} className="flex justify-between">
                  <span lang="en">{k}</span>
                  <span className={`font-medium ${FOUND.has(k) ? 'text-lp-pine' : 'text-lp-miss'}`}>
                    {FOUND.has(k) ? c.found : c.missing}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-[13px] text-lp-body md:hidden">
              {c.foundSummary(DEMO_KEYWORDS.length - missing.length, DEMO_KEYWORDS.length)} ·{' '}
              <span className="font-medium text-lp-miss">{c.missingSummary(missing.join(', '))}</span>
            </p>
          </div>

          <div className="flex flex-col gap-3 p-4 md:gap-4 md:p-6">
            <p className={`${label} hidden md:block`}>{c.bullet}</p>
            <div className="flex flex-col gap-1.5">
              <p className="hidden text-[13px] text-lp-muted md:block">{c.before}</p>
              <p lang="en" className="text-sm leading-relaxed text-lp-muted line-through decoration-[#B8B3A8] md:text-[15px]">
                {c.beforeText}
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="hidden text-[13px] font-medium text-lp-pine md:block">{c.after}</p>
              <p lang="en" className="text-sm leading-relaxed md:text-[15px]">
                <Runs runs={c.afterHtml} />
              </p>
            </div>
            {/* Visual only: this is a picture of the editor, not a working control. */}
            <div className="mt-1 flex gap-2.5" aria-hidden="true">
              <span className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-lp-control bg-lp-pine px-4 text-sm text-white md:flex-none">
                {c.keep}
              </span>
              <span className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-lp-control border border-[#C9C4B9] bg-white px-4 text-sm md:flex-none">
                {c.retry}
              </span>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="text-[13px] text-lp-muted">{c.caption}</figcaption>
    </figure>
  )
}
