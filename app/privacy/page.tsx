import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'AURI Privacy Policy — how we collect, use, and protect your personal information.',
  alternates: { canonical: 'https://www.auri-resume.com/privacy' },
}

const sections = [
  { id: 'what-we-collect', label: 'What Information Do We Collect?' },
  { id: 'how-we-process', label: 'How Do We Process Your Information?' },
  { id: 'sharing', label: 'When and With Whom Do We Share Your Personal Information?' },
  { id: 'ai-products', label: 'Do We Offer AI-Based Products?' },
  { id: 'social-logins', label: 'How Do We Handle Your Social Logins?' },
  { id: 'retention', label: 'How Long Do We Keep Your Information?' },
  { id: 'security', label: 'How Do We Keep Your Information Safe?' },
  { id: 'minors', label: 'Do We Collect Information From Minors?' },
  { id: 'your-rights', label: 'What Are Your Privacy Rights?' },
  { id: 'do-not-track', label: 'Controls for Do-Not-Track Features' },
  { id: 'us-residents', label: 'Do United States Residents Have Specific Privacy Rights?' },
  { id: 'updates', label: 'Do We Make Updates to This Notice?' },
  { id: 'contact', label: 'How Can You Contact Us?' },
  { id: 'data-requests', label: 'How Can You Review, Update, or Delete Your Data?' },
]

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0F] text-[#F8F8FF] px-6 py-16">
      <div className="max-w-3xl mx-auto">

        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#60607A] hover:text-[#A0A0B8] transition-colors mb-10"
        >
          ← Back to AURI
        </Link>

        {/* Header */}
        <header className="mb-12">
          <p className="text-xs font-medium uppercase tracking-widest text-[#6366F1] mb-3">Legal</p>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm text-[#60607A]">Last updated: June 02, 2026</p>
        </header>

        {/* Introduction */}
        <section className="mb-10 prose-section">
          <p className="text-[#A0A0B8] leading-relaxed">
            This Privacy Notice for AURI (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) describes how and
            why we might access, collect, store, use, and/or share (&ldquo;process&rdquo;) your personal information
            when you use our services (&ldquo;Services&rdquo;), including when you visit our website at{' '}
            <a href="https://www.auri-resume.com" className="text-[#6366F1] hover:text-[#818CF8] transition-colors">
              www.auri-resume.com
            </a>
            , or use any of our AI-powered career tools.
          </p>
          <p className="text-[#A0A0B8] leading-relaxed mt-4">
            Reading this notice will help you understand your privacy rights and choices. If you do not agree with our
            policies and practices, please do not use our Services. If you still have any questions or concerns, please
            contact us at{' '}
            <a href="mailto:support@auri-resume.com" className="text-[#6366F1] hover:text-[#818CF8] transition-colors">
              support@auri-resume.com
            </a>
            .
          </p>
        </section>

        <hr className="border-white/[0.08] mb-10" />

        {/* Summary of Key Points */}
        <section className="mb-10">
          <h2 className="font-heading text-xl font-semibold text-white mb-4">Summary of Key Points</h2>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            This summary provides key points from our Privacy Notice, but you can find more details about any of these
            topics in the full sections below.
          </p>
          <ul className="space-y-3 text-[#A0A0B8]">
            <li className="flex gap-3">
              <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-[#6366F1]" />
              <span>
                <strong className="text-white">What personal information do we process?</strong> When you visit, use,
                or navigate our Services, we may process personal information depending on how you interact with us and
                the Services, the choices you make, and the features you use.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-[#6366F1]" />
              <span>
                <strong className="text-white">Do we process any sensitive personal information?</strong> We do not
                process sensitive personal information.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-[#6366F1]" />
              <span>
                <strong className="text-white">Do we collect any information from third parties?</strong> We do not
                collect any information from third parties beyond what is needed to authenticate your account via Google
                OAuth.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-[#6366F1]" />
              <span>
                <strong className="text-white">How do we process your information?</strong> We process your information
                to provide, improve, and administer our Services, communicate with you, and ensure the security and
                functionality of the platform.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-[#6366F1]" />
              <span>
                <strong className="text-white">What are your rights?</strong> Depending on where you are located, you
                may have rights that allow you greater access to and control over your personal information.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-[#6366F1]" />
              <span>
                <strong className="text-white">How do you exercise your rights?</strong> The easiest way is by emailing
                us at{' '}
                <a href="mailto:support@auri-resume.com" className="text-[#6366F1] hover:text-[#818CF8] transition-colors">
                  support@auri-resume.com
                </a>
                .
              </span>
            </li>
          </ul>
        </section>

        <hr className="border-white/[0.08] mb-10" />

        {/* Table of Contents */}
        <section className="mb-10">
          <h2 className="font-heading text-xl font-semibold text-white mb-4">Table of Contents</h2>
          <ol className="space-y-2">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-[#6366F1] hover:text-[#818CF8] transition-colors text-sm"
                >
                  {i + 1}. {s.label}
                </a>
              </li>
            ))}
          </ol>
        </section>

        <hr className="border-white/[0.08] mb-10" />

        {/* 1. What Information Do We Collect? */}
        <section id="what-we-collect" className="mb-10 scroll-mt-8">
          <h2 className="font-heading text-xl font-semibold text-white mb-4">
            1. What Information Do We Collect?
          </h2>

          <h3 className="font-heading text-base font-semibold text-white mb-2">
            Personal information you disclose to us
          </h3>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            We collect personal information that you voluntarily provide to us when you register for an account,
            use our Services, or contact us. This includes:
          </p>
          <ul className="space-y-2 text-[#A0A0B8] mb-6">
            {[
              'Name and email address (via sign-up or Google OAuth)',
              'Resume content, work history, and career-related text you enter into AURI',
              'Cover letters, LinkedIn drafts, and other documents you generate or save',
              'Payment information (processed by Stripe — we do not store raw card data)',
              'Messages you send to our support team',
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-[#60607A]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <h3 className="font-heading text-base font-semibold text-white mb-2">
            Information collected automatically
          </h3>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            When you visit our Services, we automatically collect certain information including your IP address,
            browser type, device type, operating system, referring URLs, and pages viewed. This data is used
            solely for security, debugging, and improving the reliability of our platform.
          </p>

          <h3 className="font-heading text-base font-semibold text-white mb-2">
            Guest mode data
          </h3>
          <p className="text-[#A0A0B8] leading-relaxed">
            If you use AURI without signing in, your data is stored only in your browser&apos;s localStorage. It is
            never sent to our servers unless you choose to create an account, at which point your local data is
            migrated to your Firestore profile.
          </p>
        </section>

        <hr className="border-white/[0.08] mb-10" />

        {/* 2. How Do We Process Your Information? */}
        <section id="how-we-process" className="mb-10 scroll-mt-8">
          <h2 className="font-heading text-xl font-semibold text-white mb-4">
            2. How Do We Process Your Information?
          </h2>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            We process your information for the following purposes:
          </p>
          <ul className="space-y-2 text-[#A0A0B8]">
            {[
              'To create and manage your account and authenticate your identity',
              'To deliver the core features of AURI — resume building, ATS scoring, cover letter generation, LinkedIn rewriting, and interview prep',
              'To send your resume and job description text to our AI provider (Anthropic) for processing and return AI-generated suggestions to you',
              'To process payments and manage your subscription through Stripe',
              'To respond to your support requests and communications',
              'To monitor for abuse, enforce rate limits, and protect the security and integrity of our platform',
              'To improve and develop new features based on how the Services are used',
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-[#60607A]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <hr className="border-white/[0.08] mb-10" />

        {/* 3. When and With Whom Do We Share? */}
        <section id="sharing" className="mb-10 scroll-mt-8">
          <h2 className="font-heading text-xl font-semibold text-white mb-4">
            3. When and With Whom Do We Share Your Personal Information?
          </h2>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            We do not sell your personal information. We share your information only in the following limited
            circumstances:
          </p>
          <ul className="space-y-3 text-[#A0A0B8]">
            <li className="flex gap-3">
              <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-[#60607A]" />
              <span>
                <strong className="text-white">Service providers.</strong> We share data with third-party vendors who
                help us operate the platform, including Anthropic (AI processing), Firebase and Google Cloud
                (authentication and database), Stripe (payments), Vercel (hosting), and Upstash (rate limiting).
                Each provider is bound by data processing agreements appropriate to their role.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-[#60607A]" />
              <span>
                <strong className="text-white">Legal requirements.</strong> We may disclose your information if required
                to do so by law or in response to valid requests by public authorities.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-[#60607A]" />
              <span>
                <strong className="text-white">Business transfers.</strong> We may share or transfer your information
                in connection with, or during negotiations of, any merger, sale of company assets, financing, or
                acquisition of all or a portion of our business.
              </span>
            </li>
          </ul>
        </section>

        <hr className="border-white/[0.08] mb-10" />

        {/* 4. AI-Based Products */}
        <section id="ai-products" className="mb-10 scroll-mt-8">
          <h2 className="font-heading text-xl font-semibold text-white mb-4">
            4. Do We Offer AI-Based Products?
          </h2>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            Yes. AURI&apos;s core features — resume rewriting, ATS optimization, cover letter generation, LinkedIn
            profile rewriting, job strategy, and interview preparation — are powered by AI.
          </p>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            Our AI provider is{' '}
            <strong className="text-white">Anthropic</strong> (
            <a href="https://www.anthropic.com" className="text-[#6366F1] hover:text-[#818CF8] transition-colors">
              anthropic.com
            </a>
            ). When you use an AI-powered feature, the text you provide — such as your resume content or a job
            description — is sent to Anthropic&apos;s API for processing. Anthropic&apos;s data handling is governed
            by their own{' '}
            <a href="https://www.anthropic.com/privacy" className="text-[#6366F1] hover:text-[#818CF8] transition-colors">
              privacy policy
            </a>
            .
          </p>
          <p className="text-[#A0A0B8] leading-relaxed">
            We never send your name, email address, payment information, or any account identifiers to Anthropic.
            Only the content you explicitly submit to an AI feature is transmitted.
          </p>
        </section>

        <hr className="border-white/[0.08] mb-10" />

        {/* 5. Social Logins */}
        <section id="social-logins" className="mb-10 scroll-mt-8">
          <h2 className="font-heading text-xl font-semibold text-white mb-4">
            5. How Do We Handle Your Social Logins?
          </h2>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            AURI offers the option to register and log in using your Google account (via Google OAuth). When you
            choose to do this, we receive certain profile information from Google, including your name, email
            address, and profile picture URL.
          </p>
          <p className="text-[#A0A0B8] leading-relaxed">
            We use this information only to create and maintain your AURI account. We do not use your Google data
            for any other purpose, and we do not access your Google Drive, Gmail, Calendar, or any other Google
            services.
          </p>
        </section>

        <hr className="border-white/[0.08] mb-10" />

        {/* 6. Retention */}
        <section id="retention" className="mb-10 scroll-mt-8">
          <h2 className="font-heading text-xl font-semibold text-white mb-4">
            6. How Long Do We Keep Your Information?
          </h2>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            We retain your personal information for as long as your account is active or as needed to provide you
            with our Services. Specifically:
          </p>
          <ul className="space-y-2 text-[#A0A0B8] mb-4">
            <li className="flex gap-3">
              <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-[#60607A]" />
              <span>Account and profile data is kept for the lifetime of your account.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-[#60607A]" />
              <span>Saved resumes, cover letters, strategies, and interview sessions are retained until you delete them or close your account.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-[#60607A]" />
              <span>Stripe retains billing records according to their own data retention policies and applicable financial regulations.</span>
            </li>
          </ul>
          <p className="text-[#A0A0B8] leading-relaxed">
            When you request account deletion, we will delete or anonymize your personal information within 30 days,
            except where we are required to retain it for legal or regulatory compliance.
          </p>
        </section>

        <hr className="border-white/[0.08] mb-10" />

        {/* 7. Security */}
        <section id="security" className="mb-10 scroll-mt-8">
          <h2 className="font-heading text-xl font-semibold text-white mb-4">
            7. How Do We Keep Your Information Safe?
          </h2>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            We implement appropriate technical and organizational security measures designed to protect your personal
            information. These include:
          </p>
          <ul className="space-y-2 text-[#A0A0B8] mb-4">
            {[
              'All data is transmitted over HTTPS with TLS encryption',
              'Authentication is handled by Firebase Auth, which follows Google security standards',
              'Your data is stored in Google Firestore with access controlled by Firebase security rules',
              'Payment processing is handled entirely by Stripe — we never store raw card numbers',
              'API keys and secrets are never exposed to client-side code',
              'Rate limiting is enforced to prevent abuse of AI-powered features',
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-[#60607A]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-[#A0A0B8] leading-relaxed">
            However, no method of transmission over the internet or method of electronic storage is 100% secure.
            While we strive to use commercially acceptable means to protect your personal information, we cannot
            guarantee its absolute security.
          </p>
        </section>

        <hr className="border-white/[0.08] mb-10" />

        {/* 8. Minors */}
        <section id="minors" className="mb-10 scroll-mt-8">
          <h2 className="font-heading text-xl font-semibold text-white mb-4">
            8. Do We Collect Information From Minors?
          </h2>
          <p className="text-[#A0A0B8] leading-relaxed">
            We do not knowingly collect data from or market to children under 18 years of age. By using the Services,
            you represent that you are at least 18 years old. If we learn that personal information from users less
            than 18 years of age has been collected, we will take reasonable measures to promptly delete such data
            from our records. If you become aware of any data we may have collected from children under age 18,
            please contact us at{' '}
            <a href="mailto:support@auri-resume.com" className="text-[#6366F1] hover:text-[#818CF8] transition-colors">
              support@auri-resume.com
            </a>
            .
          </p>
        </section>

        <hr className="border-white/[0.08] mb-10" />

        {/* 9. Privacy Rights */}
        <section id="your-rights" className="mb-10 scroll-mt-8">
          <h2 className="font-heading text-xl font-semibold text-white mb-4">
            9. What Are Your Privacy Rights?
          </h2>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            Depending on your location, you may have the following rights regarding your personal information:
          </p>
          <ul className="space-y-2 text-[#A0A0B8] mb-6">
            {[
              'The right to access the personal information we hold about you',
              'The right to correct inaccurate or incomplete personal information',
              'The right to request deletion of your personal information',
              'The right to restrict or object to our processing of your personal information',
              'The right to data portability (receiving a copy of your data in a structured format)',
              'The right to withdraw consent at any time where we rely on consent to process your data',
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-[#60607A]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-[#A0A0B8] leading-relaxed">
            To exercise any of these rights, please contact us at{' '}
            <a href="mailto:support@auri-resume.com" className="text-[#6366F1] hover:text-[#818CF8] transition-colors">
              support@auri-resume.com
            </a>
            . We will respond to your request within 30 days.
          </p>
        </section>

        <hr className="border-white/[0.08] mb-10" />

        {/* 10. Do Not Track */}
        <section id="do-not-track" className="mb-10 scroll-mt-8">
          <h2 className="font-heading text-xl font-semibold text-white mb-4">
            10. Controls for Do-Not-Track Features
          </h2>
          <p className="text-[#A0A0B8] leading-relaxed">
            Most web browsers and some mobile operating systems include a Do-Not-Track (&ldquo;DNT&rdquo;) feature or
            setting you can activate to signal your privacy preference not to have data about your online browsing
            activities monitored and collected. At this stage, no uniform technology standard for recognizing and
            implementing DNT signals has been finalized. As such, we do not currently respond to DNT browser signals
            or any other mechanism that automatically communicates your choice not to be tracked online. If a standard
            for online tracking is adopted that we must follow in the future, we will inform you about that practice
            in a revised version of this Privacy Notice.
          </p>
        </section>

        <hr className="border-white/[0.08] mb-10" />

        {/* 11. US Residents */}
        <section id="us-residents" className="mb-10 scroll-mt-8">
          <h2 className="font-heading text-xl font-semibold text-white mb-4">
            11. Do United States Residents Have Specific Privacy Rights?
          </h2>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            If you are a resident of California, Colorado, Connecticut, Utah, Virginia, or other US states with
            applicable privacy laws, you may have specific rights regarding your personal information. These may
            include:
          </p>
          <ul className="space-y-2 text-[#A0A0B8] mb-6">
            <li className="flex gap-3">
              <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-[#60607A]" />
              <span>
                <strong className="text-white">California (CCPA/CPRA):</strong> The right to know about personal
                information collected, disclosed, or sold; the right to delete personal information; the right to
                opt out of the &ldquo;sale&rdquo; of personal information (we do not sell your data); and the right
                to non-discrimination for exercising your rights.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-[#60607A]" />
              <span>
                <strong className="text-white">Other states:</strong> Similar rights around access, correction,
                deletion, and portability may apply under your state&apos;s law.
              </span>
            </li>
          </ul>
          <p className="text-[#A0A0B8] leading-relaxed">
            To exercise these rights, please contact us at{' '}
            <a href="mailto:support@auri-resume.com" className="text-[#6366F1] hover:text-[#818CF8] transition-colors">
              support@auri-resume.com
            </a>
            . We will verify your identity before fulfilling any request and respond within the timeframe required
            by applicable law (generally 45 days).
          </p>
        </section>

        <hr className="border-white/[0.08] mb-10" />

        {/* 12. Updates */}
        <section id="updates" className="mb-10 scroll-mt-8">
          <h2 className="font-heading text-xl font-semibold text-white mb-4">
            12. Do We Make Updates to This Notice?
          </h2>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            Yes, we may update this Privacy Notice from time to time. The updated version will be indicated by an
            updated &ldquo;Last updated&rdquo; date at the top of this page. If we make material changes to this
            Privacy Notice, we may notify you either by prominently posting a notice of such changes or by directly
            sending you a notification.
          </p>
          <p className="text-[#A0A0B8] leading-relaxed">
            We encourage you to review this Privacy Notice frequently to stay informed about how we are protecting
            your information.
          </p>
        </section>

        <hr className="border-white/[0.08] mb-10" />

        {/* 13. Contact */}
        <section id="contact" className="mb-10 scroll-mt-8">
          <h2 className="font-heading text-xl font-semibold text-white mb-4">
            13. How Can You Contact Us?
          </h2>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            If you have questions or comments about this notice, you may contact us by email at:
          </p>
          <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
            <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-5">
              <p className="text-white font-semibold">AURI</p>
              <a
                href="mailto:support@auri-resume.com"
                className="text-[#6366F1] hover:text-[#818CF8] transition-colors text-sm"
              >
                support@auri-resume.com
              </a>
            </div>
          </div>
        </section>

        <hr className="border-white/[0.08] mb-10" />

        {/* 14. Data Requests */}
        <section id="data-requests" className="mb-16 scroll-mt-8">
          <h2 className="font-heading text-xl font-semibold text-white mb-4">
            14. How Can You Review, Update, or Delete Your Data?
          </h2>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            Based on the applicable laws of your country or state, you may have the right to request access to the
            personal information we collect from you, details about how we have processed it, correct inaccuracies,
            or delete your personal information.
          </p>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            You can manage much of your data directly within your AURI account settings — including editing your
            profile, deleting saved resumes and cover letters, and cancelling your subscription.
          </p>
          <p className="text-[#A0A0B8] leading-relaxed">
            To request full account deletion or a copy of your data, please email{' '}
            <a href="mailto:support@auri-resume.com" className="text-[#6366F1] hover:text-[#818CF8] transition-colors">
              support@auri-resume.com
            </a>{' '}
            with the subject line &ldquo;Data Request.&rdquo; We will process your request within 30 days.
          </p>
        </section>

        {/* Footer nav */}
        <div className="border-t border-white/[0.08] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[#60607A]">© 2026 AURI. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/" className="text-sm text-[#60607A] hover:text-white transition-colors">Home</Link>
            <Link href="/contact" className="text-sm text-[#60607A] hover:text-white transition-colors">Contact</Link>
            <a href="mailto:support@auri-resume.com" className="text-sm text-[#60607A] hover:text-white transition-colors">support@auri-resume.com</a>
          </div>
        </div>

      </div>
    </main>
  )
}
