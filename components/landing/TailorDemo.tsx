// Static sample of the tailoring flow: job post → keyword check → one
// rewritten bullet → ATS score. It is labelled as a sample on the page.
// TODO: replace with a real screenshot or the real ATSScorePanel output.

const KEYWORDS: { word: string; found: boolean }[] = [
  { word: 'Tableau', found: true },
  { word: 'SQL', found: true },
  { word: 'stakeholders', found: true },
  { word: 'Python', found: false },
]

function M({ children }: { children: React.ReactNode }) {
  return <mark className="bg-lp-mark px-0.5 text-lp-ink">{children}</mark>
}

const label = 'font-lp-mono text-[11px] uppercase tracking-[0.08em] text-lp-muted md:text-xs'

export default function TailorDemo() {
  const missing = KEYWORDS.filter((k) => !k.found)
  return (
    <figure className="m-0 flex flex-col gap-2.5 md:gap-3">
      <div className="overflow-hidden rounded-lp-panel border border-lp-rule bg-white shadow-lp-lift">
        <div className="flex items-center justify-between gap-3 border-b border-lp-hairline px-4 py-3 md:px-6 md:py-3.5">
          <p className="text-[13px] font-medium md:text-sm">
            <span className="hidden md:inline">Tailoring for: </span>Data Analyst, Sample Co.
          </p>
          <p className="whitespace-nowrap font-lp-mono text-xs text-lp-muted md:text-[13px]">
            <span className="hidden md:inline">ATS match </span>
            <span className="md:hidden">ATS </span>
            <del className="text-lp-muted" aria-label="before 61">61</del>{' '}
            <ins className="font-medium text-lp-pine no-underline" aria-label="after 87">87</ins>
          </p>
        </div>

        <div className="grid md:grid-cols-2">
          <div className="flex flex-col gap-2.5 border-b border-lp-hairline bg-lp-sheet p-4 md:gap-3.5 md:border-b-0 md:border-r md:p-6">
            <p className={label}>Job post</p>
            <p className="text-sm leading-[1.65] text-lp-body md:text-[15px] md:leading-[1.7]">
              You will build dashboards in <M>Tableau</M>, write <M>SQL</M> against large order datasets, and present
              findings to <M>stakeholders</M> in sales and finance. Experience with <M>Python</M> is a plus.
            </p>
            <ul className="mt-1.5 hidden list-none flex-col gap-2 p-0 text-sm md:flex">
              {KEYWORDS.map((k) => (
                <li key={k.word} className="flex justify-between">
                  <span>{k.word}</span>
                  <span className={`font-medium ${k.found ? 'text-lp-pine' : 'text-lp-miss'}`}>
                    {k.found ? 'Found' : 'Missing'}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-[13px] text-lp-body md:hidden">
              Found {KEYWORDS.length - missing.length} of {KEYWORDS.length} ·{' '}
              <span className="font-medium text-lp-miss">Missing: {missing.map((k) => k.word).join(', ')}</span>
            </p>
          </div>

          <div className="flex flex-col gap-3 p-4 md:gap-4 md:p-6">
            <p className={`${label} hidden md:block`}>Your resume, one bullet</p>
            <div className="flex flex-col gap-1.5">
              <p className="hidden text-[13px] text-lp-muted md:block">Before</p>
              <p className="text-sm leading-relaxed text-lp-muted line-through decoration-[#B8B3A8] md:text-[15px]">
                Made weekly reports for the sales team.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="hidden text-[13px] font-medium text-lp-pine md:block">After</p>
              <p className="text-sm leading-relaxed md:text-[15px]">
                Built weekly <M>Tableau</M> dashboards from <M>SQL</M> queries on order data, used by sales and finance{' '}
                <M>stakeholders</M> in quota reviews.
              </p>
            </div>
            {/* Visual only: this is a picture of the editor, not a working control. */}
            <div className="mt-1 flex gap-2.5" aria-hidden="true">
              <span className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-lp-control bg-lp-pine px-4 text-sm text-white md:flex-none">
                Keep rewrite
              </span>
              <span className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-lp-control border border-[#C9C4B9] bg-white px-4 text-sm md:flex-none">
                Try again
              </span>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="text-[13px] text-lp-muted">Sample job post and output.</figcaption>
    </figure>
  )
}
