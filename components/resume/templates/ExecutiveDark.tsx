import type { ResumeData } from '@/types'

interface ExecutiveDarkProps {
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

// ExecutiveDark — Dark header with gold accent strip, premium serif typography.
// Designed for senior/executive candidates who want gravitas without sacrificing ATS safety.
// ATS rule: dark header is decorative only; all text is in standard HTML, no images.
export default function ExecutiveDark({ data, personal, isEditing: _isEditing }: ExecutiveDarkProps) {
  return (
    <>
      <style>{`
        .exec-dark { font-family: 'Arial', 'Helvetica Neue', sans-serif; color: #1a1a1a; background: white; width: 210mm; min-height: 297mm; box-sizing: border-box; }

        /* Header — dark background with gold accent */
        .exec-dark .header-wrap { background: #111827; padding: 20px 32px 16px; border-bottom: 3px solid #C9A84C; }
        .exec-dark h1 { font-family: 'Georgia', 'Times New Roman', serif; font-size: 24px; font-weight: 700; color: #F9FAFB; letter-spacing: 0.03em; margin: 0 0 4px 0; }
        .exec-dark .contact-line { font-size: 9.5px; color: #9CA3AF; letter-spacing: 0.04em; }
        .exec-dark .contact-sep { color: #C9A84C; margin: 0 5px; }

        /* Body */
        .exec-dark .body-wrap { padding: 16px 32px 20px; }
        .exec-dark .section-header { display: flex; align-items: center; gap: 10px; margin: 12px 0 6px 0; }
        .exec-dark .section-label { font-size: 9px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #111827; white-space: nowrap; }
        .exec-dark .section-rule { flex: 1; height: 1px; background: linear-gradient(to right, #C9A84C, transparent); }

        .exec-dark .job-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1px; }
        .exec-dark .job-title { font-size: 11px; font-weight: 700; color: #111827; }
        .exec-dark .job-company { font-size: 11px; color: #374151; font-style: italic; }
        .exec-dark .job-dates { font-size: 9.5px; color: #C9A84C; font-weight: 600; white-space: nowrap; margin-left: 8px; flex-shrink: 0; }
        .exec-dark ul { margin: 3px 0 6px 15px; padding: 0; }
        .exec-dark li { font-size: 10px; margin-bottom: 2px; line-height: 1.4; color: #374151; }
        .exec-dark .summary-text { font-size: 10px; line-height: 1.5; color: #374151; margin: 0; font-style: italic; }
        .exec-dark .skills-list { font-size: 10px; color: #374151; line-height: 1.6; }
        .exec-dark .edu-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
        .exec-dark .edu-degree { font-size: 11px; font-weight: 700; color: #111827; }
        .exec-dark .edu-school { font-size: 10px; color: #374151; font-style: italic; }
        .exec-dark .edu-year { font-size: 9.5px; color: #C9A84C; font-weight: 600; white-space: nowrap; margin-left: 8px; flex-shrink: 0; }

        @media print {
          .exec-dark { }
          .exec-dark * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .exec-dark .header-wrap { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      <div className="exec-dark" data-ats-field="resume-root">

        {/* Dark header */}
        <div className="header-wrap" data-ats-field="header">
          <h1 data-ats-field="name">{personal.name || 'Your Name'}</h1>
          <div className="contact-line" data-ats-field="contact">
            {[personal.email, personal.phone, personal.location, personal.linkedin_url, personal.website]
              .filter(Boolean)
              .map((v, i, arr) => (
                <span key={i}>
                  {v}{i < arr.length - 1 && <span className="contact-sep">·</span>}
                </span>
              ))}
          </div>
        </div>

        {/* Body */}
        <div className="body-wrap">

          {/* Summary */}
          {data.summary && (
            <section data-ats-field="summary">
              <div className="section-header">
                <span className="section-label">Executive Summary</span>
                <div className="section-rule" />
              </div>
              <p className="summary-text">{data.summary}</p>
            </section>
          )}

          {/* Experience */}
          {data.experience.length > 0 && (
            <section data-ats-field="experience">
              <div className="section-header">
                <span className="section-label">Professional Experience</span>
                <div className="section-rule" />
              </div>
              {data.experience.map((exp) => (
                <article key={exp.id} style={{ marginBottom: '8px' }}>
                  <div className="job-header">
                    <div>
                      <span className="job-title">{exp.title}</span>
                      {exp.company && <span className="job-company">{' — '}{exp.company}</span>}
                    </div>
                    <span className="job-dates">{exp.start} – {exp.end}</span>
                  </div>
                  <ul>
                    {exp.bullets.map((bullet, i) => (
                      <li key={i}>{bullet}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </section>
          )}

          {/* Education */}
          {data.education.length > 0 && (
            <section data-ats-field="education">
              <div className="section-header">
                <span className="section-label">Education</span>
                <div className="section-rule" />
              </div>
              {data.education.map((edu) => (
                <div key={edu.id} className="edu-row">
                  <div>
                    <span className="edu-degree">{edu.degree} in {edu.field}</span>
                    <span className="edu-school">, {edu.institution}</span>
                    {edu.gpa && <span className="edu-school"> · GPA {edu.gpa}</span>}
                  </div>
                  <span className="edu-year">{edu.year}</span>
                </div>
              ))}
            </section>
          )}

          {/* Leadership */}
          {data.leadership && data.leadership.length > 0 && (
            <section data-ats-field="leadership">
              <div className="section-header">
                <span className="section-label">Leadership</span>
                <div className="section-rule" />
              </div>
              {data.leadership.map((item) => (
                <article key={item.id} style={{ marginBottom: '8px' }}>
                  <div className="job-header">
                    <div>
                      <span className="job-title">{item.role}</span>
                      {item.organization && <span className="job-company">{' — '}{item.organization}</span>}
                    </div>
                    <span className="job-dates">{item.start} – {item.end}</span>
                  </div>
                  <ul>
                    {item.bullets.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                </article>
              ))}
            </section>
          )}

          {/* Volunteer */}
          {data.volunteer && data.volunteer.length > 0 && (
            <section data-ats-field="volunteer">
              <div className="section-header">
                <span className="section-label">Volunteer</span>
                <div className="section-rule" />
              </div>
              {data.volunteer.map((item) => (
                <article key={item.id} style={{ marginBottom: '10px' }}>
                  <div className="job-header">
                    <div>
                      <span className="job-title">{item.role}</span>
                      {item.organization && <span className="job-company">{' — '}{item.organization}</span>}
                    </div>
                    <span className="job-dates">{item.date}</span>
                  </div>
                  {item.description && <p style={{ fontSize: '11px', color: '#374151', margin: '2px 0 0 0' }}>{item.description}</p>}
                </article>
              ))}
            </section>
          )}

          {/* Languages */}
          {data.languages && data.languages.length > 0 && (
            <section data-ats-field="languages">
              <div className="section-header">
                <span className="section-label">Languages</span>
                <div className="section-rule" />
              </div>
              <p className="skills-list">
                {data.languages.map((l) => `${l.name} (${l.proficiency})`).join(' · ')}
              </p>
            </section>
          )}

          {/* Skills */}
          {data.skills.length > 0 && (
            <section data-ats-field="skills">
              <div className="section-header">
                <span className="section-label">Core Competencies</span>
                <div className="section-rule" />
              </div>
              <p className="skills-list">{data.skills.join(' · ')}</p>
            </section>
          )}

          {/* Certifications */}
          {data.certifications.length > 0 && (
            <section data-ats-field="certifications">
              <div className="section-header">
                <span className="section-label">Certifications</span>
                <div className="section-rule" />
              </div>
              <p className="skills-list">{data.certifications.join(' · ')}</p>
            </section>
          )}

          {/* Projects */}
          {data.projects.length > 0 && (
            <section data-ats-field="projects">
              <div className="section-header">
                <span className="section-label">Key Projects</span>
                <div className="section-rule" />
              </div>
              {data.projects.map((proj) => (
                <article key={proj.id} style={{ marginBottom: '10px' }}>
                  <div className="job-header">
                    <span className="job-title">{proj.name}</span>
                    {proj.url && <span className="job-dates">{proj.url}</span>}
                  </div>
                  {proj.description && <p style={{ fontSize: '11px', color: '#374151', margin: '2px 0 4px 0' }}>{proj.description}</p>}
                  {proj.bullets.length > 0 && (
                    <ul>
                      {proj.bullets.map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                  )}
                </article>
              ))}
            </section>
          )}
        </div>
      </div>
    </>
  )
}
