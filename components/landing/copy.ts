// Landing page copy. Both languages share one layout (components/landing/Landing.tsx);
// the Korean page is written for Koreans applying to jobs abroad, not translated line by line.
// Resume, cover letter and interview samples stay in English on both pages because
// that is what AURI produces.

export type Lang = 'en' | 'ko'

export type Step = {
  n: string
  id?: string
  title: string
  body: string
  pro?: boolean
  link: { label: string; href: string }
  example:
    | { kind: 'score'; label: string; value: string; ariaLabel: string; note: string }
    | { kind: 'tune'; before: string; active: string; after: string }
    | { kind: 'letter'; text: string; caption: string }
    | { kind: 'interview'; counter: string; question: string; star: [string, string, string, string] }
}

export type PricingCopy = {
  title: string
  body: string
  groupLabel: string
  monthly: string
  annual: string
  annualShort: string
  tableCaption: string
  planHeader: string
  free: { name: string; price: string; note: string; summary: string; cta: string }
  pro: { name: string; cta: string; summary: string }
  price: Record<'monthly' | 'annual', { amount: string; unit: string; note: string }>
  included: string
  notIncluded: string
  rows: { feature: string; free: string | null; pro: string; strong?: boolean }[]
  currencyNote: string | null
}

export type NavCopy = {
  home: string
  mainLabel: string
  links: { label: string; href: string }[]
  login: string
  start: string
  menuOpen: string
  menuClose: string
  switchTo: { label: string; href: string; hrefLang: Lang; ariaLabel: string }
}

export type LandingCopy = {
  lang: Lang
  skip: string
  nav: NavCopy
  hero: { eyebrow: string; title: string; body: string; cta: string; upload: string; note: string }
  demo: {
    tailoringFor: string
    role: string
    atsLong: string
    atsShort: string
    beforeAria: string
    afterAria: string
    jobPost: string
    jobPostHtml: { text: string; mark?: boolean }[]
    jobPostShortHtml: { text: string; mark?: boolean }[]
    found: string
    missing: string
    foundSummary: (found: number, total: number) => string
    missingSummary: (words: string) => string
    bullet: string
    before: string
    after: string
    beforeText: string
    afterHtml: { text: string; mark?: boolean }[]
    keep: string
    retry: string
    caption: string
  }
  differences: {
    title: string
    body: string
    headers: [string, string, string]
    mobileLabels: [string, string]
    rows: { topic: string; home: string; abroad: string }[]
  } | null
  how: {
    title: string
    body: string
    proBadge: string
    steps: Step[]
    alsoLabel: string
    also: { title: string; body: string; href: string }[]
  }
  testimonialLabel: string
  pricing: PricingCopy
  footer: { poweredBy: string; copyright: string; label: string; links: { label: string; href: string }[] }
}

const KEYWORDS = ['Tableau', 'SQL', 'stakeholders', 'Python']

const jobPost = [
  { text: 'You will build dashboards in ' },
  { text: 'Tableau', mark: true },
  { text: ', write ' },
  { text: 'SQL', mark: true },
  { text: ' against large order datasets, and present findings to ' },
  { text: 'stakeholders', mark: true },
  { text: ' in sales and finance. Experience with ' },
  { text: 'Python', mark: true },
  { text: ' is a plus.' },
]
const jobPostShort = [
  { text: 'Build dashboards in ' },
  { text: 'Tableau', mark: true },
  { text: ', write ' },
  { text: 'SQL', mark: true },
  { text: ' against order data, present to ' },
  { text: 'stakeholders', mark: true },
  { text: '. ' },
  { text: 'Python', mark: true },
  { text: ' is a plus.' },
]
const afterBullet = [
  { text: 'Built weekly ' },
  { text: 'Tableau', mark: true },
  { text: ' dashboards from ' },
  { text: 'SQL', mark: true },
  { text: ' queries on order data, used by sales and finance ' },
  { text: 'stakeholders', mark: true },
  { text: ' in quota reviews.' },
]

export const DEMO_KEYWORDS = KEYWORDS

const LETTER =
  'Dear Hiring Team, your posting asks for someone who can turn order data into decisions sales can act on. For the past two years that has been most of my week.'
const QUESTION = "Tell me about a time your analysis changed a stakeholder's decision."

export const en: LandingCopy = {
  lang: 'en',
  skip: 'Skip to content',
  nav: {
    home: 'AURI home',
    mainLabel: 'Main',
    links: [
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Blog', href: '/blog' },
    ],
    login: 'Log in',
    start: 'Start free',
    menuOpen: 'Open menu',
    menuClose: 'Close menu',
    switchTo: { label: '한국어', href: '/ko', hrefLang: 'ko', ariaLabel: '한국어 페이지로 이동' },
  },
  hero: {
    eyebrow: 'Resume, cover letter, interview prep',
    title: 'Paste the job post. Get a resume written for it.',
    body: 'AURI reads the posting, rewrites your resume to match it, and shows which keywords are still missing before you apply.',
    cta: 'Start free',
    upload: 'Upload an existing resume',
    note: 'Free plan includes 3 AI generations a month. No credit card required.',
  },
  demo: {
    tailoringFor: 'Tailoring for: ',
    role: 'Data Analyst, Sample Co.',
    atsLong: 'ATS match ',
    atsShort: 'ATS ',
    beforeAria: 'before 61',
    afterAria: 'after 87',
    jobPost: 'Job post',
    jobPostHtml: jobPost,
    jobPostShortHtml: jobPostShort,
    found: 'Found',
    missing: 'Missing',
    foundSummary: (f, t) => `Found ${f} of ${t}`,
    missingSummary: (w) => `Missing: ${w}`,
    bullet: 'Your resume, one bullet',
    before: 'Before',
    after: 'After',
    beforeText: 'Made weekly reports for the sales team.',
    afterHtml: afterBullet,
    keep: 'Keep rewrite',
    retry: 'Try again',
    caption: 'Sample job post and output.',
  },
  differences: null,
  how: {
    title: 'One job post, from resume to interview.',
    body: 'Everything below works from the same two inputs: your background and the posting you are applying to. You add them once.',
    proBadge: 'Pro',
    steps: [
      {
        n: '01',
        id: 'ats',
        title: 'Tailor the resume',
        body: 'Paste your current resume or fill in your background, then add the job post. AURI writes a version for that role and scores the match in real time.',
        link: { label: 'Open the resume builder', href: '/dashboard/resume' },
        example: {
          kind: 'score',
          label: 'ATS match',
          value: '87 / 100',
          ariaLabel: 'Sample ATS match score, 87 out of 100',
          note: 'Formatted for Workday, Greenhouse, Lever and iCIMS.',
        },
      },
      {
        n: '02',
        title: 'Fix it line by line',
        body: 'Easy Tune lets you edit inline and rewrite a single bullet without touching the rest. Keep what reads like you, discard what does not.',
        link: { label: 'Try Easy Tune', href: '/dashboard/resume' },
        example: {
          kind: 'tune',
          before: 'Led migration of reporting from Excel to a shared database.',
          active: "Moved the team's weekly reporting from Excel files to a shared SQL database, removing manual copy-paste.",
          after: 'Presented monthly results to regional managers.',
        },
      },
      {
        n: '03',
        title: 'Write the cover letter',
        body: 'A 280 to 300 word letter built from the same resume and posting, so the two tell one story.',
        link: { label: 'Open the cover letter generator', href: '/dashboard/cover-letter' },
        example: { kind: 'letter', text: LETTER, caption: 'Sample opening, full letter 280–300 words' },
      },
      {
        n: '04',
        title: 'Prepare for the interview',
        body: 'Eight questions you are likely to be asked for this role, each with a STAR outline drawn from your own experience, as flip cards.',
        pro: true,
        link: { label: 'Open interview prep', href: '/dashboard/interview' },
        example: {
          kind: 'interview',
          counter: 'Question 3 of 8',
          question: QUESTION,
          star: ['Situation', 'Task', 'Action', 'Result'],
        },
      },
    ],
    alsoLabel: 'Also in Pro, for the search as a whole',
    also: [
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
    ],
  },
  testimonialLabel: 'From someone who used it',
  pricing: {
    title: 'Two plans.',
    body: 'Free covers the resume and cover letter. Pro removes the limit and adds the rest.',
    groupLabel: 'Billing period',
    monthly: 'Monthly',
    annual: 'Yearly, 2 months free',
    annualShort: 'Yearly',
    tableCaption: 'Free and Pro plan comparison',
    planHeader: 'Plan',
    free: {
      name: 'Free',
      price: '$0',
      note: 'No charge',
      summary: '3 AI generations a month. Resume builder, ATS optimizer and cover letter generator.',
      cta: 'Start free',
    },
    pro: {
      name: 'Pro',
      cta: 'Start with Pro',
      summary:
        'Unlimited AI generations. Everything in Free, plus the Resume Rewriter, interview prep, LinkedIn Rewriter, the 7-Day Job Strategy and priority support.',
    },
    price: {
      monthly: { amount: '$19', unit: '/ month', note: 'Billed monthly, or $190 a year' },
      annual: { amount: '$190', unit: '/ year', note: 'Works out to $15.83 a month, 2 months free' },
    },
    included: 'Included',
    notIncluded: 'Not included',
    rows: [
      { feature: 'AI generations', free: '3 a month', pro: 'Unlimited', strong: true },
      { feature: 'Resume builder and ATS optimizer', free: 'Included', pro: 'Included' },
      { feature: 'Cover letter generator', free: 'Included', pro: 'Included' },
      { feature: 'Resume Rewriter', free: null, pro: 'Included' },
      { feature: 'Interview prep', free: null, pro: 'Included' },
      { feature: 'LinkedIn Rewriter', free: null, pro: 'Included' },
      { feature: '7-Day Job Strategy', free: null, pro: 'Included' },
      { feature: 'Priority support', free: null, pro: 'Included' },
    ],
    currencyNote: null,
  },
  footer: {
    poweredBy: "AI features run on Anthropic's Claude.",
    copyright: '© 2026 AURI',
    label: 'Footer',
    links: [
      { label: 'Blog', href: '/blog' },
      { label: 'Contact', href: '/contact' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
    ],
  },
}

export const ko: LandingCopy = {
  lang: 'ko',
  skip: '본문으로 건너뛰기',
  nav: {
    home: 'AURI 홈',
    mainLabel: '주요 메뉴',
    links: [
      { label: '이용 방법', href: '#how-it-works' },
      { label: '요금', href: '#pricing' },
      { label: '블로그', href: '/blog' },
    ],
    login: '로그인',
    start: '무료로 시작하기',
    menuOpen: '메뉴 열기',
    menuClose: '메뉴 닫기',
    switchTo: { label: 'English', href: '/', hrefLang: 'en', ariaLabel: 'Switch to English' },
  },
  hero: {
    eyebrow: '해외 취업 · 영문 이력서 · 영어 면접',
    title: '공고를 붙여넣으면\n맞춤 영문 이력서가\n나옵니다.',
    body: 'AURI가 채용 공고를 읽고 이력서를 그 직무에 맞게 다시 씁니다. 지원하기 전에 아직 빠진 키워드가 무엇인지도 알려 드립니다.',
    cta: '무료로 시작하기',
    upload: '기존 이력서 불러오기',
    note: '무료 플랜은 매월 AI 생성 3회를 제공합니다. 카드 등록은 필요 없습니다.',
  },
  demo: {
    tailoringFor: '지원 직무: ',
    role: 'Data Analyst, Sample Co.',
    atsLong: 'ATS 일치도 ',
    atsShort: 'ATS ',
    beforeAria: '수정 전 61점',
    afterAria: '수정 후 87점',
    jobPost: '채용 공고',
    jobPostHtml: jobPost,
    jobPostShortHtml: jobPostShort,
    found: '반영됨',
    missing: '누락',
    foundSummary: (f, t) => `키워드 ${t}개 중 ${f}개 반영`,
    missingSummary: (w) => `누락: ${w}`,
    bullet: '내 이력서의 한 줄',
    before: '수정 전',
    after: '수정 후',
    beforeText: 'Responsible for making weekly sales reports.',
    afterHtml: afterBullet,
    keep: '이대로 쓰기',
    retry: '다시 쓰기',
    caption: '샘플 공고와 결과 예시입니다.',
  },
  differences: {
    title: '해외 기업은 이력서를 다르게 읽습니다.',
    body: '국내 지원서에 익숙할수록 놓치기 쉬운 차이입니다. AURI가 만드는 영문 이력서는 해외 지원 기준을 따릅니다.',
    headers: ['항목', '국내 지원서에서 흔한 방식', '해외 지원용 영문 이력서'],
    mobileLabels: ['국내', '해외'],
    rows: [
      {
        topic: '개인 정보',
        home: '사진, 생년월일, 주소를 함께 적습니다.',
        abroad: '이름, 연락처, 링크만 적습니다. 사진과 나이는 넣지 않습니다.',
      },
      {
        topic: '경력 문장',
        home: '맡은 업무를 나열합니다.',
        abroad: 'Built, Led 같은 동사로 시작해 한 일과 결과를 한 줄에 씁니다.',
      },
      {
        topic: '공고와의 연결',
        home: '같은 이력서를 여러 곳에 냅니다.',
        abroad: '공고마다 쓰인 용어에 맞춰 문장을 고칩니다.',
      },
      {
        topic: '처음 읽는 쪽',
        home: '담당자가 직접 읽는 경우가 많습니다.',
        abroad: 'Workday, Greenhouse 같은 채용 시스템(ATS)이 먼저 읽고 걸러 냅니다.',
      },
    ],
  },
  how: {
    title: '공고 하나로 이력서부터 면접까지.',
    body: '아래 기능은 모두 같은 두 가지 정보로 움직입니다. 내 경력과 지원할 공고입니다. 한 번만 입력하면 됩니다.',
    proBadge: 'Pro',
    steps: [
      {
        n: '01',
        id: 'ats',
        title: '공고에 맞춘 이력서',
        body: '지금 쓰는 이력서를 붙여넣거나 경력을 입력하고, 지원할 공고를 추가하세요. AURI가 그 직무에 맞춘 영문 이력서를 만들고 공고와 얼마나 맞는지 바로 점수로 보여 줍니다.',
        link: { label: '이력서 빌더 열기', href: '/dashboard/resume' },
        example: {
          kind: 'score',
          label: 'ATS 일치도',
          value: '87 / 100',
          ariaLabel: '샘플 ATS 일치도, 100점 중 87점',
          note: 'Workday, Greenhouse, Lever, iCIMS에서 읽히는 형식으로 만듭니다.',
        },
      },
      {
        n: '02',
        title: '한 줄씩 다듬기',
        body: 'Easy Tune에서 문장을 직접 고치거나, 마음에 들지 않는 한 줄만 골라 다시 쓰게 할 수 있습니다. 나머지 문장은 그대로 둡니다.',
        link: { label: 'Easy Tune 써 보기', href: '/dashboard/resume' },
        example: {
          kind: 'tune',
          before: 'Led migration of reporting from Excel to a shared database.',
          active: "Moved the team's weekly reporting from Excel files to a shared SQL database, removing manual copy-paste.",
          after: 'Presented monthly results to regional managers.',
        },
      },
      {
        n: '03',
        title: '영문 커버레터',
        body: '같은 이력서와 공고를 바탕으로 280~300단어 분량의 커버레터를 씁니다. 이력서와 커버레터가 같은 이야기를 합니다.',
        link: { label: '커버레터 만들기', href: '/dashboard/cover-letter' },
        example: { kind: 'letter', text: LETTER, caption: '샘플 첫 문단 · 전체 280~300단어' },
      },
      {
        n: '04',
        title: '영어 면접 준비',
        body: '이 직무에서 나올 만한 질문 8개와, 내 경험으로 채운 STAR(상황·과제·행동·결과) 답변 구조를 플래시카드로 연습합니다.',
        pro: true,
        link: { label: '면접 준비 열기', href: '/dashboard/interview' },
        example: {
          kind: 'interview',
          counter: '8개 중 3번째 질문',
          question: QUESTION,
          star: ['상황', '과제', '행동', '결과'],
        },
      },
    ],
    alsoLabel: 'Pro에서는 구직 전체를 돕는 기능도 씁니다',
    also: [
      {
        title: 'LinkedIn 프로필 리라이터',
        body: '해당 직무를 찾는 해외 리크루터의 검색에 걸리도록 프로필을 다시 씁니다.',
        href: '/dashboard/linkedin',
      },
      {
        title: '7일 구직 전략',
        body: '구직 일주일을 하루 단위로 나눈 나만의 실행 계획입니다.',
        href: '/dashboard/strategy',
      },
    ],
  },
  testimonialLabel: '먼저 써 본 사람의 이야기',
  pricing: {
    title: '플랜은 두 가지입니다.',
    body: '무료 플랜으로 이력서와 커버레터를 만들 수 있습니다. Pro는 횟수 제한을 없애고 나머지 기능을 모두 엽니다.',
    groupLabel: '결제 주기',
    monthly: '월간',
    annual: '연간 · 2개월 무료',
    annualShort: '연간',
    tableCaption: '무료 플랜과 Pro 플랜 비교',
    planHeader: '플랜',
    free: {
      name: '무료',
      price: '$0',
      note: '요금 없음',
      summary: '매월 AI 생성 3회. 이력서 빌더, ATS 최적화, 커버레터 생성을 쓸 수 있습니다.',
      cta: '무료로 시작하기',
    },
    pro: {
      name: 'Pro',
      cta: 'Pro로 시작하기',
      summary:
        'AI 생성 무제한. 무료 플랜의 모든 기능에 더해 이력서 리라이터, 영어 면접 준비, LinkedIn 프로필 리라이터, 7일 구직 전략, 우선 고객 지원을 제공합니다.',
    },
    price: {
      monthly: { amount: '$19', unit: '/ 월', note: '매월 결제, 연간 결제 시 $190' },
      annual: { amount: '$190', unit: '/ 년', note: '월 $15.83꼴, 2개월 무료' },
    },
    included: '포함',
    notIncluded: '미포함',
    rows: [
      { feature: 'AI 생성 횟수', free: '월 3회', pro: '무제한', strong: true },
      { feature: '이력서 빌더 · ATS 최적화', free: '포함', pro: '포함' },
      { feature: '커버레터 생성', free: '포함', pro: '포함' },
      { feature: '이력서 리라이터', free: null, pro: '포함' },
      { feature: '영어 면접 준비', free: null, pro: '포함' },
      { feature: 'LinkedIn 프로필 리라이터', free: null, pro: '포함' },
      { feature: '7일 구직 전략', free: null, pro: '포함' },
      { feature: '우선 고객 지원', free: null, pro: '포함' },
    ],
    currencyNote: '결제는 미국 달러(USD)로 진행됩니다.',
  },
  footer: {
    poweredBy: 'AI 기능은 Anthropic의 Claude로 동작합니다.',
    copyright: '© 2026 AURI',
    label: '하단 메뉴',
    links: [
      { label: '블로그', href: '/blog' },
      { label: '문의하기', href: '/contact' },
      { label: '이용약관 (영문)', href: '/terms' },
      { label: '개인정보처리방침 (영문)', href: '/privacy' },
    ],
  },
}
