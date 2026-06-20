// Quick local test: render a full sample resume through /api/pdf and count pages.
// Run with: node scripts/test-pdf.mjs
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const css = `
@font-face { font-family: 'Tinos'; font-weight: 400; font-style: normal; src: url('http://localhost:3000/fonts/Tinos-Regular.woff2') format('woff2'); font-display: block; }
@font-face { font-family: 'Tinos'; font-weight: 700; font-style: normal; src: url('http://localhost:3000/fonts/Tinos-Bold.woff2') format('woff2'); font-display: block; }
@font-face { font-family: 'Arimo'; font-weight: 400; font-style: normal; src: url('http://localhost:3000/fonts/Arimo-Regular.woff2') format('woff2'); font-display: block; }
@font-face { font-family: 'Arimo'; font-weight: 700; font-style: normal; src: url('http://localhost:3000/fonts/Arimo-Bold.woff2') format('woff2'); font-display: block; }
body { margin: 0; padding: 0; background: white; }
* { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.classic-pro { font-family: 'Tinos','Times New Roman',Times,serif; color: #1a1a1a; background: white; width: 8.5in; min-height: 11in; box-sizing: border-box; padding: 18mm 20mm 16mm; }
.classic-pro h1 { font-size: 22px; font-weight: 700; letter-spacing: 0.02em; margin: 0 0 4px 0; text-align: center; }
.classic-pro .contact-line { font-size: 10px; color: #444; text-align: center; margin-bottom: 10px; font-family: 'Arimo',Arial,sans-serif; letter-spacing: 0.02em; }
.classic-pro .section-header { font-size: 10.5px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #1a1a1a; border-bottom: 1.5px solid #1a1a1a; padding-bottom: 2px; margin: 11px 0 6px 0; font-family: 'Arimo',Arial,sans-serif; }
.classic-pro .job-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1px; }
.classic-pro .job-title { font-size: 11px; font-weight: 700; font-family: 'Arimo',Arial,sans-serif; }
.classic-pro .job-company { font-size: 11px; font-style: italic; }
.classic-pro .job-dates { font-size: 10px; color: #555; font-family: 'Arimo',Arial,sans-serif; white-space: nowrap; margin-left: 8px; flex-shrink: 0; }
.classic-pro ul { margin: 3px 0 7px 15px; padding: 0; }
.classic-pro li { font-size: 10.5px; margin-bottom: 1.5px; line-height: 1.4; }
.classic-pro .summary-text { font-size: 10.5px; line-height: 1.5; margin: 0; }
.classic-pro .skills-list { font-size: 10.5px; line-height: 1.5; }
.classic-pro .edu-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
.classic-pro .edu-degree { font-size: 11px; font-weight: 700; font-family: 'Arimo',Arial,sans-serif; }
.classic-pro .edu-school { font-size: 10.5px; font-style: italic; }
.classic-pro .edu-year { font-size: 10px; color: #555; font-family: 'Arimo',Arial,sans-serif; white-space: nowrap; flex-shrink: 0; margin-left: 8px; }
`

const body = `
<div class="classic-pro">
  <header>
    <h1>Lucas Seongin Cho</h1>
    <div class="contact-line">
      <span>lucas@example.com</span><span> · </span><span>555-123-4567</span>
      <span> · </span><span>New York, NY</span><span> · </span><span>LinkedIn</span>
    </div>
  </header>
  <section>
    <div class="section-header">Summary</div>
    <p class="summary-text">Results-driven software engineer with 5+ years of experience building scalable web applications. Proven track record of delivering high-impact features that improve user engagement and reduce operational costs. Expert in React, TypeScript, and Node.js with a strong background in system design and cross-functional collaboration.</p>
  </section>
  <section>
    <div class="section-header">Experience</div>
    <article style="margin-bottom:8px">
      <div class="job-header"><div><span class="job-title">Senior Software Engineer</span><span class="job-company">, Acme Corp</span></div><span class="job-dates">Jan 2022 – Present</span></div>
      <ul>
        <li>Led development of a microservices migration that reduced API latency by 40% and cut infrastructure costs by $200K annually</li>
        <li>Built and shipped a real-time collaboration feature serving 50K+ daily active users with 99.9% uptime</li>
        <li>Mentored 4 junior engineers, conducting weekly code reviews and establishing team best practices for TypeScript and testing</li>
        <li>Architected a data pipeline processing 10M+ events per day, enabling product analytics that drove a 15% increase in retention</li>
      </ul>
    </article>
    <article style="margin-bottom:8px">
      <div class="job-header"><div><span class="job-title">Software Engineer</span><span class="job-company">, Startup XYZ</span></div><span class="job-dates">Jun 2020 – Dec 2021</span></div>
      <ul>
        <li>Developed the core checkout flow in React that increased conversion rates by 22% and generated $1.2M in additional revenue</li>
        <li>Implemented automated testing suite (Jest + Cypress) that reduced regression bugs by 60% and cut QA cycle time in half</li>
        <li>Collaborated with design and product teams to deliver 12 major features on schedule across 4 quarterly planning cycles</li>
        <li>Optimized PostgreSQL queries and added Redis caching, reducing average page load time from 3.2s to 0.8s</li>
      </ul>
    </article>
    <article style="margin-bottom:8px">
      <div class="job-header"><div><span class="job-title">Junior Software Engineer</span><span class="job-company">, Tech Agency LLC</span></div><span class="job-dates">Aug 2019 – May 2020</span></div>
      <ul>
        <li>Built responsive React components for 6 client projects, achieving consistent cross-browser compatibility</li>
        <li>Integrated third-party APIs (Stripe, Twilio, Sendgrid) and wrote documentation adopted by the full engineering team</li>
        <li>Contributed to open-source libraries, earning 120+ GitHub stars on a UI toolkit published under MIT license</li>
      </ul>
    </article>
  </section>
  <section>
    <div class="section-header">Education</div>
    <div class="edu-row">
      <div><span class="edu-degree">Bachelor of Science in Computer Science</span><span class="edu-school">, State University</span></div>
      <span class="edu-year">2019</span>
    </div>
  </section>
  <section>
    <div class="section-header">Skills</div>
    <p class="skills-list">TypeScript · React · Node.js · PostgreSQL · Redis · Docker · AWS · GraphQL · REST APIs · Jest · Cypress · System Design</p>
  </section>
  <section>
    <div class="section-header">Certifications</div>
    <p class="skills-list">AWS Certified Solutions Architect · Google Cloud Professional Data Engineer</p>
  </section>
  <section>
    <div class="section-header">Projects</div>
    <article style="margin-bottom:6px">
      <div class="job-header"><span class="job-title">OpenResume</span><span class="job-dates">github.com/example/openresume</span></div>
      <ul>
        <li>Built an open-source resume builder with 2,400+ GitHub stars using React, TypeScript, and PDF generation</li>
        <li>Implemented ATS-optimization scoring algorithm that analyzes keyword density and formatting compliance</li>
      </ul>
    </article>
    <article style="margin-bottom:6px">
      <div class="job-header"><span class="job-title">DataSync CLI</span><span class="job-dates">github.com/example/datasync</span></div>
      <ul>
        <li>Created a Node.js CLI tool for synchronizing database schemas across environments, adopted by 3 engineering teams</li>
        <li>Published on npm with 800+ weekly downloads and comprehensive documentation</li>
      </ul>
    </article>
  </section>
  <section>
    <div class="section-header">Leadership</div>
    <article style="margin-bottom:7px">
      <div class="job-header"><div><span class="job-title">Engineering Lead</span><span class="job-company">, Hackathon NYC</span></div><span class="job-dates">2021 – 2023</span></div>
      <ul>
        <li>Organized 3 annual hackathons with 200+ participants each, managing sponsor relations and judging criteria</li>
        <li>Mentored 15 teams on product scoping and technical architecture, with 4 teams advancing to national competitions</li>
      </ul>
    </article>
  </section>
  <section>
    <div class="section-header">Languages</div>
    <p class="skills-list">English (Native) · Korean (Fluent) · Spanish (Intermediate)</p>
  </section>
</div>
`

const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${css}</style></head><body>${body}</body></html>`

const res = await fetch('http://localhost:3000/api/pdf', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ html, filename: 'test-resume.pdf' }),
})

if (!res.ok) {
  const text = await res.text()
  console.error('ERROR', res.status, text)
  process.exit(1)
}

const buf = Buffer.from(await res.arrayBuffer())
const outPath = path.join(__dirname, 'test-resume-output.pdf')
fs.writeFileSync(outPath, buf)

// Count pages: each page in a PDF starts with "Page" object or we can count /Type /Page entries
const pdfText = buf.toString('binary')
const pageMatches = pdfText.match(/\/Type\s*\/Page[^s]/g)
const pageCount = pageMatches ? pageMatches.length : '?'

console.log(`PDF size: ${buf.length} bytes`)
console.log(`Pages: ${pageCount}`)
console.log(`Saved to: ${outPath}`)
