'use client'

import { useState } from 'react'
import StartLink from './StartLink'

type Billing = 'monthly' | 'annual'

// Plan contents match what the product gates today: LinkedIn, Strategy,
// Interview and the Resume Rewriter sit behind ProGate / isPro.
const ROWS: { feature: string; free: string | null; pro: string }[] = [
  { feature: 'AI generations', free: '3 a month', pro: 'Unlimited' },
  { feature: 'Resume builder and ATS optimizer', free: 'Included', pro: 'Included' },
  { feature: 'Cover letter generator', free: 'Included', pro: 'Included' },
  { feature: 'Resume Rewriter', free: null, pro: 'Included' },
  { feature: 'Interview prep', free: null, pro: 'Included' },
  { feature: 'LinkedIn Rewriter', free: null, pro: 'Included' },
  { feature: '7-Day Job Strategy', free: null, pro: 'Included' },
  { feature: 'Priority support', free: null, pro: 'Included' },
]

// TODO(입력 필요): one line on refunds / cancellation plus a link to the policy.
// Rendered only when filled in. Do not invent terms here.
const REFUND_NOTE: { text: string; href: string } | null = null

const PRICE: Record<Billing, { amount: string; unit: string; note: string }> = {
  monthly: { amount: '$19', unit: '/ month', note: 'Billed monthly, or $190 a year' },
  annual: { amount: '$190', unit: '/ year', note: 'Works out to $15.83 a month, 2 months free' },
}

export default function Pricing() {
  const [billing, setBilling] = useState<Billing>('annual')
  const price = PRICE[billing]

  const toggle = (
    <div role="group" aria-label="Billing period" className="grid grid-cols-2 gap-1 rounded-md bg-lp-sunk p-1 md:inline-grid">
      {(['monthly', 'annual'] as const).map((b) => (
        <button
          key={b}
          type="button"
          aria-pressed={billing === b}
          onClick={() => setBilling(b)}
          className={`min-h-[44px] rounded-lp-control px-4 text-[15px] ${
            billing === b ? 'bg-white font-medium text-lp-ink' : 'text-lp-body hover:text-lp-ink'
          }`}
        >
          {b === 'monthly' ? 'Monthly' : (
            <>Yearly<span className="hidden md:inline">, 2 months free</span></>
          )}
        </button>
      ))}
    </div>
  )

  const cell = 'px-8 py-[18px] border-b border-lp-hairline border-l border-l-lp-rule'

  return (
    <section id="pricing" className="px-4 py-12 md:px-8 lg:py-[104px] xl:px-0">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 md:gap-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2.5 md:gap-3.5">
            <h2 className="font-lp-serif text-[32px] font-medium leading-[1.15] md:text-5xl md:leading-[1.1]">Two plans.</h2>
            <p className="text-base leading-relaxed text-lp-body md:text-lg">
              Free covers the resume and cover letter. Pro removes the limit and adds the rest.
            </p>
          </div>
          {toggle}
        </div>

        {/* Desktop: one comparison table */}
        <table className="hidden w-full border-collapse border border-lp-rule bg-white text-base md:table">
          <caption className="sr-only">Free and Pro plan comparison</caption>
          <thead>
            <tr>
              <th scope="col" className="w-[40%] border-b border-lp-rule p-8 text-left align-bottom text-[15px] font-normal text-lp-muted">
                Plan
              </th>
              <th scope="col" className="w-[30%] border-b border-l border-lp-rule p-8 text-left align-top">
                <span className="flex flex-col gap-2.5">
                  <span className="text-xl font-semibold">Free</span>
                  <span className="font-lp-serif text-[44px] font-medium leading-none">$0</span>
                  <span className="text-sm font-normal text-lp-muted">No charge</span>
                </span>
              </th>
              <th scope="col" className="w-[30%] border-b border-l border-lp-rule bg-lp-pine-tint p-8 text-left align-top">
                <span className="flex flex-col gap-2.5">
                  <span className="text-xl font-semibold text-lp-pine">Pro</span>
                  <span className="font-lp-serif text-[44px] font-medium leading-none" aria-live="polite">
                    {price.amount}
                    <span className="font-lp-sans text-base font-normal text-lp-muted"> {price.unit}</span>
                  </span>
                  <span className="text-sm font-normal text-lp-muted">{price.note}</span>
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.feature}>
                <th scope="row" className="border-b border-lp-hairline px-8 py-[18px] text-left font-normal">
                  {r.feature}
                </th>
                <td className={`${cell} ${r.free ? '' : 'text-lp-muted'}`}>{r.free ?? 'Not included'}</td>
                <td className={`${cell} bg-lp-pine-tint ${r.feature === 'AI generations' ? 'font-medium' : ''}`}>{r.pro}</td>
              </tr>
            ))}
            <tr>
              <td className="px-8 py-7 text-sm text-lp-muted">
                {REFUND_NOTE && <a href={REFUND_NOTE.href}>{REFUND_NOTE.text}</a>}
              </td>
              <td className="border-l border-lp-rule px-8 py-7">
                <StartLink
                  intent="free"
                  className="inline-flex min-h-[48px] items-center rounded-lp-control border border-lp-pine px-6 font-medium text-lp-pine no-underline hover:bg-white"
                >
                  Start free
                </StartLink>
              </td>
              <td className="border-l border-lp-rule bg-lp-pine-tint px-8 py-7">
                <StartLink
                  intent="pro"
                  className="inline-flex min-h-[48px] items-center rounded-lp-control bg-lp-pine px-6 font-medium text-white no-underline hover:bg-lp-pine-dark hover:text-white"
                >
                  Start with Pro
                </StartLink>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Phone: Pro first, then Free, written as sentences not checklists */}
        <div className="flex flex-col gap-4 md:hidden">
          <div className="flex flex-col gap-4 rounded-lp-panel border border-lp-pine bg-lp-pine-tint px-5 py-6">
            <div className="flex items-baseline justify-between">
              <h3 className="text-xl font-semibold text-lp-pine">Pro</h3>
              <p className="font-lp-serif text-4xl font-medium">
                {price.amount}
                <span className="font-lp-sans text-[15px] text-lp-muted"> {price.unit}</span>
              </p>
            </div>
            <p className="text-sm text-lp-body">{price.note}</p>
            <p className="text-[15px] leading-relaxed">
              Unlimited AI generations. Everything in Free, plus the Resume Rewriter, interview prep, LinkedIn Rewriter,
              the 7-Day Job Strategy and priority support.
            </p>
            <StartLink
              intent="pro"
              className="flex min-h-[48px] items-center justify-center rounded-lp-control bg-lp-pine font-medium text-white no-underline"
            >
              Start with Pro
            </StartLink>
          </div>
          <div className="flex flex-col gap-4 rounded-lp-panel border border-lp-rule bg-white px-5 py-6">
            <div className="flex items-baseline justify-between">
              <h3 className="text-xl font-semibold">Free</h3>
              <p className="font-lp-serif text-4xl font-medium">$0</p>
            </div>
            <p className="text-[15px] leading-relaxed">
              3 AI generations a month. Resume builder, ATS optimizer and cover letter generator.
            </p>
            <StartLink
              intent="free"
              className="flex min-h-[48px] items-center justify-center rounded-lp-control border border-lp-pine font-medium text-lp-pine no-underline"
            >
              Start free
            </StartLink>
          </div>
          {REFUND_NOTE && (
            <a href={REFUND_NOTE.href} className="text-sm">
              {REFUND_NOTE.text}
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
