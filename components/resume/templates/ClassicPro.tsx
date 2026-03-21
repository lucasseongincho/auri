import type { ResumeData } from '@/types'

interface ClassicProProps {
  data: ResumeData
  personal: {
    name: string
    email: string
    phone: string
    location: string
    linkedin_url: string
    website: string
  }
  isEditing?: boolean
}

export default function ClassicPro({ data, personal, isEditing: _isEditing }: ClassicProProps) {
  return (
    <>
      <style>{`
        .cp-root {
          font-family: 'Times New Roman', Times, serif;
          color: #1a1a1a;
          background: white;
          width: 210mm;
          min-height: 297mm;
          max-height: 297mm;
          box-sizing: border-box;
          padding: 12mm;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* ── Name block ─────────────────────────────── */
        .cp-name {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 0.02em;
          margin: 0 0 2px 0;
          line-height: 1.1;
          font-family: 'Arial', sans-serif;
        }
        .cp-title-line {
          font-size: 9px;
          color: #555;
          font-family: Arial, sans-serif;
          margin-bottom: 6px;
          letter-spacing: 0.05em;
        }

        /* ── Two-column body ────────────────────────── */
        .cp-body {
          display: flex;
          gap: 8mm;
          flex: 1;
          min-height: 0;
        }
        .cp-left {
          width: 30%;
          flex-shrink: 0;
          border-right: 1px solid #d0d0d0;
          padding-right: 6mm;
        }
        .cp-right {
          flex: 1;
          min-width: 0;
        }

        /* ── Section headers ────────────────────────── */
        .cp-sh {
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #1a1a1a;
          border-bottom: 1px solid #1a1a1a;
          padding-bottom: 2px;
          margin: 9px 0 5px 0;
          font-family: Arial, sans-serif;
        }
        .cp-sh:first-child {
          margin-top: 0;
        }

        /* ── Contact block ──────────────────────────── */
        .cp-contact-item {
          font-size: 8px;
          line-height: 1.5;
          color: #333;
          word-break: break-all;
          font-family: Arial, sans-serif;
        }
        .cp-contact-label {
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 7px;
          color: #666;
          display: block;
          margin-top: 4px;
        }

        /* ── Skills ─────────────────────────────────── */
        .cp-skill-item {
          font-size: 8.5px;
          line-height: 1.5;
          color: #1a1a1a;
        }

        /* ── Education (left) ───────────────────────── */
        .cp-edu-block {
          margin-bottom: 6px;
        }
        .cp-edu-degree {
          font-size: 8.5px;
          font-weight: 700;
          font-family: Arial, sans-serif;
          line-height: 1.3;
        }
        .cp-edu-school {
          font-size: 8px;
          font-style: italic;
          line-height: 1.3;
          color: #333;
        }
        .cp-edu-year {
          font-size: 8px;
          color: #666;
          font-family: Arial, sans-serif;
        }
        .cp-edu-gpa {
          font-size: 8px;
          color: #444;
          font-family: Arial, sans-serif;
        }

        /* ── Certifications (left) ──────────────────── */
        .cp-cert-item {
          font-size: 8.5px;
          line-height: 1.5;
          color: #1a1a1a;
        }

        /* ── Languages (left) ───────────────────────── */
        .cp-lang-row {
          display: flex;
          justify-content: space-between;
          font-size: 8.5px;
          line-height: 1.5;
        }
        .cp-lang-name { color: #1a1a1a; }
        .cp-lang-prof { color: #666; font-style: italic; font-size: 8px; }

        /* ── Summary (right) ────────────────────────── */
        .cp-summary {
          font-size: 9px;
          line-height: 1.45;
          color: #1a1a1a;
          margin: 0;
        }

        /* ── Experience / Leadership (right) ─────────── */
        .cp-job-block {
          margin-bottom: 7px;
        }
        .cp-job-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 1px;
        }
        .cp-job-title {
          font-size: 9px;
          font-weight: 700;
          font-family: Arial, sans-serif;
        }
        .cp-job-company {
          font-size: 9px;
          font-style: italic;
        }
        .cp-job-dates {
          font-size: 8px;
          color: #555;
          font-family: Arial, sans-serif;
          white-space: nowrap;
          margin-left: 6px;
          flex-shrink: 0;
        }
        .cp-bullets {
          margin: 2px 0 0 12px;
          padding: 0;
          list-style-type: disc;
        }
        .cp-bullets li {
          font-size: 8.5px;
          margin-bottom: 1px;
          line-height: 1.3;
          color: #1a1a1a;
        }

        /* ── Volunteer (right) ───────────────────────── */
        .cp-vol-block {
          margin-bottom: 5px;
        }
        .cp-vol-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }
        .cp-vol-title {
          font-size: 9px;
          font-weight: 700;
          font-family: Arial, sans-serif;
        }
        .cp-vol-org {
          font-size: 9px;
          font-style: italic;
        }
        .cp-vol-date {
          font-size: 8px;
          color: #555;
          font-family: Arial, sans-serif;
          white-space: nowrap;
          margin-left: 6px;
          flex-shrink: 0;
        }
        .cp-vol-desc {
          font-size: 8.5px;
          line-height: 1.3;
          color: #444;
          margin: 2px 0 0 0;
        }

        /* ── Projects (right) ───────────────────────── */
        .cp-proj-block {
          margin-bottom: 6px;
        }
        .cp-proj-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }
        .cp-proj-name {
          font-size: 9px;
          font-weight: 700;
          font-family: Arial, sans-serif;
        }
        .cp-proj-url {
          font-size: 8px;
          color: #555;
          font-family: Arial, sans-serif;
        }
        .cp-proj-desc {
          font-size: 8.5px;
          line-height: 1.3;
          color: #444;
          margin: 2px 0 0 0;
        }

        @media print {
          .cp-root {
            padding: 12mm !important;
            width: 210mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
          }
          .cp-root * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      <div className="cp-root" data-ats-field="resume-root">

        {/* ── Name + contact header ─────────────────── */}
        <header data-ats-field="header" style={{ marginBottom: '5px' }}>
          <h1 className="cp-name" data-ats-field="name">{personal.name || 'Your Name'}</h1>
          <div className="cp-title-line" data-ats-field="contact">
            {[personal.email, personal.phone, personal.location, personal.linkedin_url, personal.website]
              .filter(Boolean)
              .join('  ·  ')}
          </div>
          <div style={{ borderBottom: '1.5px solid #1a1a1a', marginBottom: '6px' }} />
        </header>

        {/* ── Two-column body ──────────────────────── */}
        <div className="cp-body">

          {/* LEFT COLUMN — contact details, skills, education, certs, languages */}
          <div className="cp-left">

            {/* Skills */}
            {data.skills.length > 0 && (
              <section data-ats-field="skills">
                <div className="cp-sh">Skills</div>
                {data.skills.map((s, i) => (
                  <div key={i} className="cp-skill-item">{s}</div>
                ))}
              </section>
            )}

            {/* Education */}
            {data.education.length > 0 && (
              <section data-ats-field="education">
                <div className="cp-sh">Education</div>
                {data.education.map((edu) => (
                  <div key={edu.id} className="cp-edu-block">
                    <div className="cp-edu-degree">{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</div>
                    <div className="cp-edu-school">{edu.institution}</div>
                    <div className="cp-edu-year">{edu.year}</div>
                    {edu.gpa && (
                      <div className="cp-edu-gpa">GPA: {edu.gpa}</div>
                    )}
                  </div>
                ))}
              </section>
            )}

            {/* Certifications */}
            {data.certifications.length > 0 && (
              <section data-ats-field="certifications">
                <div className="cp-sh">Certifications</div>
                {data.certifications.map((c, i) => (
                  <div key={i} className="cp-cert-item">{c}</div>
                ))}
              </section>
            )}

            {/* Languages */}
            {data.languages && data.languages.length > 0 && (
              <section data-ats-field="languages">
                <div className="cp-sh">Languages</div>
                {data.languages.map((lang) => (
                  <div key={lang.id} className="cp-lang-row">
                    <span className="cp-lang-name">{lang.name}</span>
                    <span className="cp-lang-prof">{lang.proficiency}</span>
                  </div>
                ))}
              </section>
            )}
          </div>

          {/* RIGHT COLUMN — summary, experience, leadership, volunteer, projects */}
          <div className="cp-right">

            {/* Summary */}
            {data.summary && (
              <section data-ats-field="summary" style={{ marginBottom: '4px' }}>
                <div className="cp-sh" style={{ marginTop: 0 }}>Summary</div>
                <p className="cp-summary">{data.summary}</p>
              </section>
            )}

            {/* Experience */}
            {data.experience.length > 0 && (
              <section data-ats-field="experience">
                <div className="cp-sh">Experience</div>
                {data.experience.map((exp) => (
                  <div key={exp.id} className="cp-job-block">
                    <div className="cp-job-header">
                      <div>
                        <span className="cp-job-title">{exp.title}</span>
                        {exp.company && <span className="cp-job-company">, {exp.company}</span>}
                      </div>
                      <span className="cp-job-dates">{exp.start} – {exp.end}</span>
                    </div>
                    {exp.bullets.length > 0 && (
                      <ul className="cp-bullets">
                        {exp.bullets.map((bullet, i) => (
                          <li key={i}>{bullet}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </section>
            )}

            {/* Leadership */}
            {data.leadership && data.leadership.length > 0 && (
              <section data-ats-field="leadership">
                <div className="cp-sh">Leadership</div>
                {data.leadership.map((item) => (
                  <div key={item.id} className="cp-job-block">
                    <div className="cp-job-header">
                      <div>
                        <span className="cp-job-title">{item.role}</span>
                        {item.organization && <span className="cp-job-company">, {item.organization}</span>}
                      </div>
                      <span className="cp-job-dates">{item.start} – {item.end}</span>
                    </div>
                    {item.bullets.length > 0 && (
                      <ul className="cp-bullets">
                        {item.bullets.map((bullet, i) => (
                          <li key={i}>{bullet}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </section>
            )}

            {/* Volunteer */}
            {data.volunteer && data.volunteer.length > 0 && (
              <section data-ats-field="volunteer">
                <div className="cp-sh">Volunteer</div>
                {data.volunteer.map((item) => (
                  <div key={item.id} className="cp-vol-block">
                    <div className="cp-vol-header">
                      <div>
                        <span className="cp-vol-title">{item.role}</span>
                        {item.organization && <span className="cp-vol-org">, {item.organization}</span>}
                      </div>
                      <span className="cp-vol-date">{item.date}</span>
                    </div>
                    {item.description && <p className="cp-vol-desc">{item.description}</p>}
                  </div>
                ))}
              </section>
            )}

            {/* Projects */}
            {data.projects.length > 0 && (
              <section data-ats-field="projects">
                <div className="cp-sh">Projects</div>
                {data.projects.map((proj) => (
                  <div key={proj.id} className="cp-proj-block">
                    <div className="cp-proj-header">
                      <span className="cp-proj-name">{proj.name}</span>
                      {proj.url && <span className="cp-proj-url">{proj.url}</span>}
                    </div>
                    {proj.description && <p className="cp-proj-desc">{proj.description}</p>}
                    {proj.bullets.length > 0 && (
                      <ul className="cp-bullets">
                        {proj.bullets.map((b, i) => <li key={i}>{b}</li>)}
                      </ul>
                    )}
                  </div>
                ))}
              </section>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
