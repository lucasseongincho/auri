import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'AURI Terms of Service — the legal agreement governing your use of the AURI platform.',
  alternates: { canonical: 'https://www.auri-resume.com/terms' },
}

const sections = [
  { id: 'our-services', label: 'Our Services' },
  { id: 'intellectual-property', label: 'Intellectual Property Rights' },
  { id: 'user-representations', label: 'User Representations' },
  { id: 'prohibited-activities', label: 'Prohibited Activities' },
  { id: 'user-contributions', label: 'User Generated Contributions' },
  { id: 'contribution-license', label: 'Contribution License' },
  { id: 'services-management', label: 'Services Management' },
  { id: 'term-and-termination', label: 'Term and Termination' },
  { id: 'modifications', label: 'Modifications and Interruptions' },
  { id: 'governing-law', label: 'Governing Law' },
  { id: 'dispute-resolution', label: 'Dispute Resolution' },
  { id: 'corrections', label: 'Corrections' },
  { id: 'disclaimer', label: 'Disclaimer' },
  { id: 'limitations-of-liability', label: 'Limitations of Liability' },
  { id: 'indemnification', label: 'Indemnification' },
  { id: 'user-data', label: 'User Data' },
  { id: 'electronic-communications', label: 'Electronic Communications, Transactions, and Signatures' },
  { id: 'miscellaneous', label: 'Miscellaneous' },
  { id: 'contact-us', label: 'Contact Us' },
]

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="text-sm text-[#60607A]">Last updated: June 02, 2026</p>
        </header>

        {/* 1. Agreement to Our Legal Terms */}
        <section className="mb-10">
          <h2 className="font-heading text-xl font-semibold text-white mb-4">
            Agreement to Our Legal Terms
          </h2>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            These Terms of Service (&ldquo;Terms&rdquo;) constitute a legally binding agreement between you and AURI
            (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) governing your access to and use of our
            website at{' '}
            <a href="https://www.auri-resume.com" className="text-[#6366F1] hover:text-[#818CF8] transition-colors">
              www.auri-resume.com
            </a>{' '}
            and any related services (collectively, the &ldquo;Services&rdquo;).
          </p>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            By accessing or using our Services, you confirm that you have read, understood, and agree to be bound by
            these Terms. If you do not agree with all of these Terms, you are expressly prohibited from using the
            Services and must discontinue use immediately.
          </p>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            We reserve the right to make changes to these Terms at any time and for any reason. We will alert you
            about any changes by updating the &ldquo;Last updated&rdquo; date. It is your responsibility to
            periodically review these Terms to stay informed of updates. Your continued use of the Services after
            the date of any revised Terms constitutes acceptance of those changes.
          </p>
          <p className="text-[#A0A0B8] leading-relaxed">
            The Services are intended for users who are at least 18 years old. By using the Services, you represent
            that you are at least 18 years of age. If you have any questions about these Terms, please contact us at{' '}
            <a href="mailto:support@auri-resume.com" className="text-[#6366F1] hover:text-[#818CF8] transition-colors">
              support@auri-resume.com
            </a>
            .
          </p>
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

        {/* 1. Our Services */}
        <section id="our-services" className="mb-10 scroll-mt-8">
          <h2 className="font-heading text-xl font-semibold text-white mb-4">
            1. Our Services
          </h2>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            AURI is an AI-powered career toolkit designed to help job seekers create ATS-optimized resumes, generate
            cover letters, rewrite LinkedIn profiles, plan job search strategies, and prepare for interviews. The
            information provided through our Services is not intended as professional career, legal, or financial
            advice.
          </p>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            The Services are not tailored to comply with industry-specific regulations (such as HIPAA or FINRA), so
            if your interactions would be subject to such laws, you may not use the Services for those purposes.
          </p>
          <p className="text-[#A0A0B8] leading-relaxed">
            We make no warranty that the AI-generated outputs will be accurate, error-free, or suitable for any
            particular employer or job application. You are solely responsible for reviewing, verifying, and editing
            any content generated through the Services before using it.
          </p>
        </section>

        <hr className="border-white/[0.08] mb-10" />

        {/* 2. Intellectual Property Rights */}
        <section id="intellectual-property" className="mb-10 scroll-mt-8">
          <h2 className="font-heading text-xl font-semibold text-white mb-4">
            2. Intellectual Property Rights
          </h2>

          <h3 className="font-heading text-base font-semibold text-white mb-2">Our intellectual property</h3>
          <p className="text-[#A0A0B8] leading-relaxed mb-6">
            We own or license all intellectual property rights in and to the Services, including all source code,
            databases, functionality, software, website designs, audio, video, text, photographs, and graphics
            (&ldquo;Content&rdquo;) and the trademarks, service marks, and logos contained therein
            (&ldquo;Marks&rdquo;). Our Content and Marks are protected by copyright and trademark laws and various
            other intellectual property rights and unfair competition laws in the United States and internationally.
            The Content and Marks are provided &ldquo;AS IS&rdquo; for your personal, non-commercial use or internal
            business purpose only.
          </p>

          <h3 className="font-heading text-base font-semibold text-white mb-2">Your use of our Services</h3>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable,
            revocable license to access and use the Services solely for your personal, non-commercial use. Except
            as set out in this section or elsewhere in these Terms, no part of the Services and no Content or Marks
            may be copied, reproduced, aggregated, republished, uploaded, posted, publicly displayed, encoded,
            translated, transmitted, distributed, sold, licensed, or otherwise exploited for any commercial purpose
            whatsoever, without our prior written permission.
          </p>
          <p className="text-[#A0A0B8] leading-relaxed mb-6">
            If you wish to make any use of the Services, Content, or Marks other than as set out in this section,
            please address your request to{' '}
            <a href="mailto:support@auri-resume.com" className="text-[#6366F1] hover:text-[#818CF8] transition-colors">
              support@auri-resume.com
            </a>
            .
          </p>

          <h3 className="font-heading text-base font-semibold text-white mb-2">Your submissions</h3>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            By sending us any question, comment, suggestion, idea, feedback, or other information about the Services
            (&ldquo;Submissions&rdquo;), you agree to assign to us all intellectual property rights in such
            Submission. You agree that we shall own this Submission and be entitled to its unrestricted use and
            dissemination for any lawful purpose, commercial or otherwise, without acknowledgment or compensation
            to you.
          </p>
          <p className="text-[#A0A0B8] leading-relaxed">
            You are responsible for what you post or upload to the Services. You represent and warrant that your
            Submissions do not violate any third-party intellectual property or privacy rights and are not
            illegal, offensive, or otherwise in violation of these Terms.
          </p>
        </section>

        <hr className="border-white/[0.08] mb-10" />

        {/* 3. User Representations */}
        <section id="user-representations" className="mb-10 scroll-mt-8">
          <h2 className="font-heading text-xl font-semibold text-white mb-4">
            3. User Representations
          </h2>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            By using the Services, you represent and warrant that:
          </p>
          <ul className="space-y-2 text-[#A0A0B8]">
            {[
              'You are at least 18 years of age.',
              'You have the legal capacity and agree to comply with these Terms.',
              'You are not a minor in the jurisdiction in which you reside.',
              'You will not access the Services through automated or non-human means, whether through a bot, script, or otherwise, except as expressly permitted by us.',
              'You will not use the Services for any illegal or unauthorized purpose.',
              'Your use of the Services will not violate any applicable law or regulation.',
              'All registration information you submit will be true, accurate, current, and complete, and you will maintain the accuracy of such information.',
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-[#60607A]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-[#A0A0B8] leading-relaxed mt-4">
            If you provide any information that is untrue, inaccurate, not current, or incomplete, we have the right
            to suspend or terminate your account and refuse any and all current or future use of the Services.
          </p>
        </section>

        <hr className="border-white/[0.08] mb-10" />

        {/* 4. Prohibited Activities */}
        <section id="prohibited-activities" className="mb-10 scroll-mt-8">
          <h2 className="font-heading text-xl font-semibold text-white mb-4">
            4. Prohibited Activities
          </h2>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            You may not access or use the Services for any purpose other than that for which we make the Services
            available. The Services may not be used in connection with any commercial endeavors except those that
            are specifically endorsed or approved by us.
          </p>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">As a user of the Services, you agree not to:</p>
          <ul className="space-y-2 text-[#A0A0B8]">
            {[
              'Systematically retrieve data or other content from the Services to create or compile, directly or indirectly, a collection, compilation, database, or directory without written permission from us.',
              'Trick, defraud, or mislead us and other users, especially in any attempt to learn sensitive account information such as user passwords.',
              'Circumvent, disable, or otherwise interfere with security-related features of the Services.',
              'Disparage, tarnish, or otherwise harm, in our opinion, us and/or the Services.',
              'Use any information obtained from the Services to harass, abuse, or harm another person.',
              'Make improper use of our support services or submit false reports of abuse or misconduct.',
              'Use the Services in a manner inconsistent with any applicable laws or regulations.',
              'Engage in unauthorized framing of or linking to the Services.',
              'Upload or transmit (or attempt to upload or transmit) viruses, Trojan horses, or other material that interferes with any party\'s uninterrupted use and enjoyment of the Services.',
              'Engage in any automated use of the system, such as using scripts to send comments or messages, or using any data mining, robots, or similar data gathering and extraction tools.',
              'Delete the copyright or other proprietary rights notice from any Content.',
              'Attempt to impersonate another user or person or use the username of another user.',
              'Upload or transmit (or attempt to upload or transmit) any material that acts as a passive or active information collection or transmission mechanism.',
              'Interfere with, disrupt, or create an undue burden on the Services or the networks or services connected to the Services.',
              'Harass, annoy, intimidate, or threaten any of our employees or agents engaged in providing any portion of the Services to you.',
              'Attempt to bypass any measures of the Services designed to prevent or restrict access to the Services, or any portion of the Services.',
              'Copy or adapt the Services\' software, including but not limited to Flash, PHP, HTML, JavaScript, or other code.',
              'Decipher, decompile, disassemble, or reverse engineer any of the software comprising or in any way making up a part of the Services.',
              'Use, launch, develop, or distribute any automated system, including without limitation any spider, robot, cheat utility, scraper, or offline reader that accesses the Services.',
              'Use a buying agent or purchasing agent to make purchases on the Services.',
              'Make any unauthorized use of the Services, including collecting usernames and/or email addresses of users by electronic or other means.',
              'Use the Services to advertise or offer to sell goods and services.',
              'Use AI-generated outputs to misrepresent qualifications or credentials to employers.',
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-[#60607A]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <hr className="border-white/[0.08] mb-10" />

        {/* 5. User Generated Contributions */}
        <section id="user-contributions" className="mb-10 scroll-mt-8">
          <h2 className="font-heading text-xl font-semibold text-white mb-4">
            5. User Generated Contributions
          </h2>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            The Services may invite you to chat, contribute to, or participate in blogs, message boards, online
            forums, and other functionality, and may provide you with the opportunity to create, submit, post,
            display, transmit, perform, publish, distribute, or broadcast content and materials to us or on the
            Services (&ldquo;Contributions&rdquo;). Contributions may be viewable by other users of the Services and
            through third-party websites.
          </p>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            When you create or make available any Contributions, you represent and warrant that:
          </p>
          <ul className="space-y-2 text-[#A0A0B8]">
            {[
              'The creation, distribution, transmission, public display, or performance of your Contributions does not violate the proprietary rights of any third party.',
              'You are the creator and owner of or have the necessary licenses, rights, consents, releases, and permissions to authorize us to use your Contributions.',
              'You have the written consent, release, and/or permission of each identifiable individual person in your Contributions to use their name or likeness.',
              'Your Contributions are not false, inaccurate, or misleading.',
              'Your Contributions are not unsolicited or unauthorized advertising, promotional materials, pyramid schemes, chain letters, spam, or other forms of solicitation.',
              'Your Contributions do not violate any applicable law, regulation, or rule.',
              'Your Contributions do not violate the privacy or publicity rights of any third party.',
              'Your Contributions do not contain any material that solicits personal information from anyone under the age of 18.',
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-[#60607A]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-[#A0A0B8] leading-relaxed mt-4">
            Any breach of these representations and warranties will constitute a breach of these Terms and may result
            in, among other things, termination or suspension of your rights to use the Services.
          </p>
        </section>

        <hr className="border-white/[0.08] mb-10" />

        {/* 6. Contribution License */}
        <section id="contribution-license" className="mb-10 scroll-mt-8">
          <h2 className="font-heading text-xl font-semibold text-white mb-4">
            6. Contribution License
          </h2>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            By posting your Contributions to any part of the Services, you automatically grant, and you represent
            and warrant that you have the right to grant, to us an unrestricted, unlimited, irrevocable, perpetual,
            non-exclusive, transferable, royalty-free, fully-paid, worldwide right, and license to host, use, copy,
            reproduce, disclose, sell, resell, publish, broadcast, retitle, archive, store, cache, publicly perform,
            publicly display, reformat, translate, transmit, excerpt (in whole or in part), and distribute such
            Contributions for any purpose, commercial, advertising, or otherwise, and to prepare derivative works of,
            or incorporate into other works, such Contributions, and grant and authorize sublicenses of the foregoing.
          </p>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            This license will apply to any form, media, or technology now known or hereafter developed, and includes
            our use of your name, company name, and franchise name, as applicable, and any of the trademarks, service
            marks, trade names, logos, and personal and commercial images you provide. You waive all moral rights in
            your Contributions, and you warrant that moral rights have not otherwise been asserted in your
            Contributions.
          </p>
          <p className="text-[#A0A0B8] leading-relaxed">
            We do not assert any ownership over your Contributions. You retain full ownership of all your
            Contributions and any intellectual property rights or other proprietary rights associated with your
            Contributions. We are not liable for any statements or representations in your Contributions provided
            by you in any area on the Services. You are solely responsible for your Contributions to the Services
            and you expressly agree to exonerate us from any and all responsibility and to refrain from any legal
            action against us regarding your Contributions.
          </p>
        </section>

        <hr className="border-white/[0.08] mb-10" />

        {/* 7. Services Management */}
        <section id="services-management" className="mb-10 scroll-mt-8">
          <h2 className="font-heading text-xl font-semibold text-white mb-4">
            7. Services Management
          </h2>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            We reserve the right, but not the obligation, to:
          </p>
          <ul className="space-y-2 text-[#A0A0B8] mb-4">
            {[
              'Monitor the Services for violations of these Terms.',
              'Take appropriate legal action against anyone who, in our sole discretion, violates the law or these Terms, including reporting such users to law enforcement authorities.',
              'Refuse, restrict access to, limit the availability of, or disable (to the extent technologically feasible) any of your Contributions or any portion thereof.',
              'Remove from the Services or otherwise disable all files and content that are excessive in size or are in any way burdensome to our systems.',
              'Otherwise manage the Services in a manner designed to protect our rights and property and to facilitate the proper functioning of the Services.',
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-[#60607A]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <hr className="border-white/[0.08] mb-10" />

        {/* 8. Term and Termination */}
        <section id="term-and-termination" className="mb-10 scroll-mt-8">
          <h2 className="font-heading text-xl font-semibold text-white mb-4">
            8. Term and Termination
          </h2>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            These Terms shall remain in full force and effect while you use the Services. Without limiting any other
            provision of these Terms, we reserve the right to, in our sole discretion and without notice or liability,
            deny access to and use of the Services (including blocking certain IP addresses), to any person for any
            reason or for no reason, including without limitation for breach of any representation, warranty, or
            covenant contained in these Terms or of any applicable law or regulation.
          </p>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            We may terminate your use or participation in the Services or delete your account and any content or
            information that you posted at any time, without warning, in our sole discretion.
          </p>
          <p className="text-[#A0A0B8] leading-relaxed">
            If we terminate or suspend your account for any reason, you are prohibited from registering and creating
            a new account under your name, a fake or borrowed name, or the name of any third party, even if you may
            be acting on behalf of the third party. In addition to terminating or suspending your account, we reserve
            the right to take appropriate legal action, including without limitation pursuing civil, criminal, and
            injunctive redress.
          </p>
        </section>

        <hr className="border-white/[0.08] mb-10" />

        {/* 9. Modifications and Interruptions */}
        <section id="modifications" className="mb-10 scroll-mt-8">
          <h2 className="font-heading text-xl font-semibold text-white mb-4">
            9. Modifications and Interruptions
          </h2>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            We reserve the right to change, modify, or remove the contents of the Services at any time or for any
            reason at our sole discretion without notice. We also reserve the right to modify or discontinue all or
            part of the Services without notice at any time. We will not be liable to you or any third party for any
            modification, price change, suspension, or discontinuance of the Services.
          </p>
          <p className="text-[#A0A0B8] leading-relaxed">
            We cannot guarantee the Services will be available at all times. We may experience hardware, software,
            or other problems or need to perform maintenance related to the Services, resulting in interruptions,
            delays, or errors. We reserve the right to change, revise, update, suspend, discontinue, or otherwise
            modify the Services at any time or for any reason without notice to you. You agree that we have no
            liability whatsoever for any loss, damage, or inconvenience caused by your inability to access or use
            the Services during any downtime or discontinuance of the Services.
          </p>
        </section>

        <hr className="border-white/[0.08] mb-10" />

        {/* 10. Governing Law */}
        <section id="governing-law" className="mb-10 scroll-mt-8">
          <h2 className="font-heading text-xl font-semibold text-white mb-4">
            10. Governing Law
          </h2>
          <p className="text-[#A0A0B8] leading-relaxed">
            These Terms shall be governed by and defined following the laws of the State of New York, United States.
            AURI and yourself irrevocably consent that the courts of New York shall have exclusive jurisdiction to
            resolve any dispute which may arise in connection with these Terms, subject to the arbitration provisions
            set out in the Dispute Resolution section below.
          </p>
        </section>

        <hr className="border-white/[0.08] mb-10" />

        {/* 11. Dispute Resolution */}
        <section id="dispute-resolution" className="mb-10 scroll-mt-8">
          <h2 className="font-heading text-xl font-semibold text-white mb-4">
            11. Dispute Resolution
          </h2>

          <h3 className="font-heading text-base font-semibold text-white mb-2">Informal Negotiations</h3>
          <p className="text-[#A0A0B8] leading-relaxed mb-6">
            To expedite resolution and control the cost of any dispute, controversy, or claim related to these Terms
            (&ldquo;Dispute&rdquo;), you and we agree to first attempt to negotiate any Dispute informally for at
            least 30 days before initiating arbitration. Such informal negotiations commence upon written notice from
            one Party to the other. You may send written notice to us at{' '}
            <a href="mailto:support@auri-resume.com" className="text-[#6366F1] hover:text-[#818CF8] transition-colors">
              support@auri-resume.com
            </a>
            .
          </p>

          <h3 className="font-heading text-base font-semibold text-white mb-2">Binding Arbitration</h3>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            If the Parties are unable to resolve a Dispute through informal negotiations, the Dispute (except those
            Disputes expressly excluded below) will be finally and exclusively resolved by binding arbitration. The
            arbitration shall be commenced and conducted under the Commercial Arbitration Rules of the American
            Arbitration Association (&ldquo;AAA&rdquo;) and, where appropriate, the AAA&apos;s Supplementary
            Procedures for Consumer Related Disputes, both of which are available at the AAA website (
            <a href="https://www.adr.org" className="text-[#6366F1] hover:text-[#818CF8] transition-colors">
              www.adr.org
            </a>
            ).
          </p>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            The arbitration shall be conducted by 1 arbitrator. The seat, or legal place, of arbitration shall be
            New York, United States. The language of the proceedings shall be English. The governing substantive
            law shall be the law of New York. Any award made by the arbitrator shall be final and binding on both
            Parties.
          </p>
          <p className="text-[#A0A0B8] leading-relaxed mb-6">
            Each party will bear their own costs and attorneys&apos; fees unless the arbitrator determines that a
            party&apos;s claim or defense was frivolous, in which case the arbitrator may award fees and costs to
            the prevailing party. Any Dispute must be brought within 2 years after the date the cause of action
            arose, or the claim is barred.
          </p>

          <h3 className="font-heading text-base font-semibold text-white mb-2">Restrictions</h3>
          <p className="text-[#A0A0B8] leading-relaxed mb-6">
            The Parties agree that any arbitration shall be limited to the Dispute between the Parties individually.
            To the full extent permitted by law: (a) no arbitration shall be joined with any other proceeding;
            (b) there is no right or authority for any Dispute to be arbitrated on a class-action basis or to utilize
            class action procedures; and (c) there is no right or authority for any Dispute to be brought in a
            purported representative capacity on behalf of the general public or any other persons.
          </p>

          <h3 className="font-heading text-base font-semibold text-white mb-2">Exceptions to Arbitration</h3>
          <p className="text-[#A0A0B8] leading-relaxed">
            The Parties agree that the following Disputes are not subject to the above provisions concerning
            binding arbitration: (a) any Disputes seeking to enforce or protect, or concerning the validity of,
            any of the intellectual property rights of a Party; (b) any Dispute related to, or arising from,
            allegations of theft, piracy, invasion of privacy, or unauthorized use; and (c) any claim for
            injunctive relief. If this provision is found to be illegal or unenforceable, then neither Party will
            elect to arbitrate any Dispute falling within that portion of this provision found to be illegal or
            unenforceable and such Dispute shall be decided by a court of competent jurisdiction within the courts
            of New York, and the Parties agree to submit to the personal jurisdiction of that court.
          </p>
        </section>

        <hr className="border-white/[0.08] mb-10" />

        {/* 12. Corrections */}
        <section id="corrections" className="mb-10 scroll-mt-8">
          <h2 className="font-heading text-xl font-semibold text-white mb-4">
            12. Corrections
          </h2>
          <p className="text-[#A0A0B8] leading-relaxed">
            There may be information on the Services that contains typographical errors, inaccuracies, or omissions,
            including descriptions, pricing, availability, and various other information. We reserve the right to
            correct any errors, inaccuracies, or omissions and to change or update the information on the Services
            at any time, without prior notice.
          </p>
        </section>

        <hr className="border-white/[0.08] mb-10" />

        {/* 13. Disclaimer */}
        <section id="disclaimer" className="mb-10 scroll-mt-8">
          <h2 className="font-heading text-xl font-semibold text-white mb-4">
            13. Disclaimer
          </h2>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            THE SERVICES ARE PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS. YOU AGREE THAT YOUR USE OF THE SERVICES
            WILL BE AT YOUR SOLE RISK. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS
            OR IMPLIED, IN CONNECTION WITH THE SERVICES AND YOUR USE THEREOF, INCLUDING, WITHOUT LIMITATION, THE
            IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            WE MAKE NO WARRANTIES OR REPRESENTATIONS ABOUT THE ACCURACY OR COMPLETENESS OF THE SERVICES&apos; CONTENT
            OR THE CONTENT OF ANY WEBSITES OR MOBILE APPLICATIONS LINKED TO THE SERVICES AND WE WILL ASSUME NO
            LIABILITY OR RESPONSIBILITY FOR ANY (1) ERRORS, MISTAKES, OR INACCURACIES OF CONTENT AND MATERIALS,
            (2) PERSONAL INJURY OR PROPERTY DAMAGE, OF ANY NATURE WHATSOEVER, RESULTING FROM YOUR ACCESS TO AND
            USE OF THE SERVICES, (3) ANY UNAUTHORIZED ACCESS TO OR USE OF OUR SECURE SERVERS AND/OR ANY AND ALL
            PERSONAL INFORMATION AND/OR FINANCIAL INFORMATION STORED THEREIN, (4) ANY INTERRUPTION OR CESSATION
            OF TRANSMISSION TO OR FROM THE SERVICES, (5) ANY BUGS, VIRUSES, TROJAN HORSES, OR THE LIKE WHICH MAY
            BE TRANSMITTED TO OR THROUGH THE SERVICES BY ANY THIRD PARTY, AND/OR (6) ANY ERRORS OR OMISSIONS IN
            ANY CONTENT AND MATERIALS OR FOR ANY LOSS OR DAMAGE OF ANY KIND INCURRED AS A RESULT OF THE USE OF
            ANY CONTENT POSTED, TRANSMITTED, OR OTHERWISE MADE AVAILABLE VIA THE SERVICES.
          </p>
          <p className="text-[#A0A0B8] leading-relaxed">
            AI-generated resume and career content is provided for informational and productivity purposes only.
            AURI does not guarantee that use of any AI-generated content will result in employment, interviews,
            or any specific career outcome.
          </p>
        </section>

        <hr className="border-white/[0.08] mb-10" />

        {/* 14. Limitations of Liability */}
        <section id="limitations-of-liability" className="mb-10 scroll-mt-8">
          <h2 className="font-heading text-xl font-semibold text-white mb-4">
            14. Limitations of Liability
          </h2>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE TO YOU OR ANY THIRD PARTY FOR
            ANY DIRECT, INDIRECT, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING
            LOST PROFIT, LOST REVENUE, LOSS OF DATA, OR OTHER DAMAGES ARISING FROM YOUR USE OF THE SERVICES,
            EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
          </p>
          <p className="text-[#A0A0B8] leading-relaxed">
            NOTWITHSTANDING ANYTHING TO THE CONTRARY CONTAINED HEREIN, OUR LIABILITY TO YOU FOR ANY CAUSE
            WHATSOEVER AND REGARDLESS OF THE FORM OF THE ACTION, WILL AT ALL TIMES BE LIMITED TO THE AMOUNT PAID,
            IF ANY, BY YOU TO US DURING THE SIX (6) MONTH PERIOD PRIOR TO ANY CAUSE OF ACTION ARISING. CERTAIN
            US STATE LAWS AND INTERNATIONAL LAWS DO NOT ALLOW LIMITATIONS ON IMPLIED WARRANTIES OR THE EXCLUSION
            OR LIMITATION OF CERTAIN DAMAGES. IF THESE LAWS APPLY TO YOU, SOME OR ALL OF THE ABOVE DISCLAIMERS
            OR LIMITATIONS MAY NOT APPLY TO YOU, AND YOU MAY HAVE ADDITIONAL RIGHTS.
          </p>
        </section>

        <hr className="border-white/[0.08] mb-10" />

        {/* 15. Indemnification */}
        <section id="indemnification" className="mb-10 scroll-mt-8">
          <h2 className="font-heading text-xl font-semibold text-white mb-4">
            15. Indemnification
          </h2>
          <p className="text-[#A0A0B8] leading-relaxed">
            You agree to defend, indemnify, and hold us harmless, including our subsidiaries, affiliates, and all
            of our respective officers, agents, partners, and employees, from and against any loss, damage,
            liability, claim, or demand, including reasonable attorneys&apos; fees and expenses, made by any third
            party due to or arising out of: (1) your Contributions; (2) use of the Services; (3) breach of these
            Terms; (4) any breach of your representations and warranties set forth in these Terms; (5) your violation
            of the rights of a third party, including but not limited to intellectual property rights; or (6) any
            overt harmful act toward any other user of the Services with whom you connected via the Services.
            Notwithstanding the foregoing, we reserve the right, at your expense, to assume the exclusive defense
            and control of any matter for which you are required to indemnify us, and you agree to cooperate, at
            your expense, with our defense of such claims. We will use reasonable efforts to notify you of any such
            claim, action, or proceeding which is subject to this indemnification upon becoming aware of it.
          </p>
        </section>

        <hr className="border-white/[0.08] mb-10" />

        {/* 16. User Data */}
        <section id="user-data" className="mb-10 scroll-mt-8">
          <h2 className="font-heading text-xl font-semibold text-white mb-4">
            16. User Data
          </h2>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            We will maintain certain data that you transmit to the Services for the purpose of managing the
            performance of the Services, as well as data relating to your use of the Services. Although we perform
            regular routine backups of data, you are solely responsible for all data that you transmit or that
            relates to any activity you have undertaken using the Services.
          </p>
          <p className="text-[#A0A0B8] leading-relaxed">
            You agree that we shall have no liability to you for any loss or corruption of any such data, and you
            hereby waive any right of action against us arising from any such loss or corruption of such data.
            For full details on how we collect, store, and handle your personal information, please review our{' '}
            <Link href="/privacy" className="text-[#6366F1] hover:text-[#818CF8] transition-colors">
              Privacy Policy
            </Link>
            .
          </p>
        </section>

        <hr className="border-white/[0.08] mb-10" />

        {/* 17. Electronic Communications */}
        <section id="electronic-communications" className="mb-10 scroll-mt-8">
          <h2 className="font-heading text-xl font-semibold text-white mb-4">
            17. Electronic Communications, Transactions, and Signatures
          </h2>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            Visiting the Services, sending us emails, and completing online forms constitute electronic
            communications. You consent to receive electronic communications, and you agree that all agreements,
            notices, disclosures, and other communications we provide to you electronically, via email and on the
            Services, satisfy any legal requirement that such communication be in writing.
          </p>
          <p className="text-[#A0A0B8] leading-relaxed">
            YOU HEREBY AGREE TO THE USE OF ELECTRONIC SIGNATURES, CONTRACTS, ORDERS, AND OTHER RECORDS, AND TO
            ELECTRONIC DELIVERY OF NOTICES, POLICIES, AND RECORDS OF TRANSACTIONS INITIATED OR COMPLETED BY US
            OR VIA THE SERVICES. You hereby waive any rights or requirements under any statutes, regulations,
            rules, ordinances, or other laws in any jurisdiction which require an original signature or delivery
            or retention of non-electronic records, or to payments or the granting of credits by any means other
            than electronic means.
          </p>
        </section>

        <hr className="border-white/[0.08] mb-10" />

        {/* 18. Miscellaneous */}
        <section id="miscellaneous" className="mb-10 scroll-mt-8">
          <h2 className="font-heading text-xl font-semibold text-white mb-4">
            18. Miscellaneous
          </h2>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            These Terms and any policies or operating rules posted by us on the Services or in respect to the
            Services constitute the entire agreement and understanding between you and us. Our failure to exercise
            or enforce any right or provision of these Terms shall not operate as a waiver of such right or
            provision.
          </p>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            These Terms operate to the fullest extent permissible by law. We may assign any or all of our rights
            and obligations to others at any time. We shall not be responsible or liable for any loss, damage,
            delay, or failure to act caused by any cause beyond our reasonable control.
          </p>
          <p className="text-[#A0A0B8] leading-relaxed mb-4">
            If any provision or part of a provision of these Terms is determined to be unlawful, void, or
            unenforceable, that provision or part of the provision is deemed severable from these Terms and does
            not affect the validity and enforceability of any remaining provisions.
          </p>
          <p className="text-[#A0A0B8] leading-relaxed">
            There is no joint venture, partnership, employment, or agency relationship created between you and us
            as a result of these Terms or use of the Services. You agree that these Terms will not be construed
            against us by virtue of having drafted them. You hereby waive any and all defenses you may have based
            on the electronic form of these Terms and the lack of signing by the Parties hereto to execute these
            Terms.
          </p>
        </section>

        <hr className="border-white/[0.08] mb-10" />

        {/* 19. Contact Us */}
        <section id="contact-us" className="mb-16 scroll-mt-8">
          <h2 className="font-heading text-xl font-semibold text-white mb-4">
            19. Contact Us
          </h2>
          <p className="text-[#A0A0B8] leading-relaxed mb-6">
            In order to resolve a complaint regarding the Services or to receive further information regarding use
            of the Services, please contact us at:
          </p>
          <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
            <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-5 space-y-1">
              <p className="text-white font-semibold">AURI</p>
              <p className="text-[#A0A0B8] text-sm">464 Old Country Rd</p>
              <p className="text-[#A0A0B8] text-sm">Melville, NY 11747</p>
              <p className="text-[#A0A0B8] text-sm">United States</p>
              <a
                href="mailto:support@auri-resume.com"
                className="block text-[#6366F1] hover:text-[#818CF8] transition-colors text-sm pt-1"
              >
                support@auri-resume.com
              </a>
            </div>
          </div>
        </section>

        {/* Footer nav */}
        <div className="border-t border-white/[0.08] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[#60607A]">© 2026 AURI. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/" className="text-sm text-[#60607A] hover:text-white transition-colors">Home</Link>
            <Link href="/privacy" className="text-sm text-[#60607A] hover:text-white transition-colors">Privacy</Link>
            <Link href="/contact" className="text-sm text-[#60607A] hover:text-white transition-colors">Contact</Link>
          </div>
        </div>

      </div>
    </main>
  )
}
