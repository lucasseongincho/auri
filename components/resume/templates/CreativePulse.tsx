import type { ResumeData } from '@/types'

interface CreativePulseProps {
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

// CreativePulse — Subtle grid texture, bold name treatment, left accent bar on sections.
// For design, marketing, product, and creative professionals.
// ATS-safe: grid texture is a CSS background pattern on a wrapper div, not an image.
// All text is in standard semantic HTML with data-ats-field attributes.
export default function CreativePulse({ data, personal, isEditing: _isEditing }: CreativePulseProps) {
  return (
    <>
      <style>{`
        .creative-pulse {
          font-family: 'Helvetica Neue', 'Arial', sans-serif;
          color: #1a1a1a;
          background: white;
          background-image:
            linear-gradient(rgba(99, 102, 241, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.04) 1px, transparent 1px);
          background-size: 24px 24px;
        }

        /* Name block */
        .creative-pulse .name-block { padding: 22px 32px 0; }
        .creative-pulse h1 {
          font-size: 28px;
          font-weight: 900;
          letter-spacing: -0.02em;
          color: #0F0F0F;
          margin: 0 0 2px 0;
          line-height: 1;
        }
        .creative-pulse .tagline {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #6366F1;
          margin-bottom: 6px;
        }
        .creative-pulse .contact-line {
          font-size: 9.5px;
          color: #666;
          margin-bottom: 12px;
        }
        .creative-pulse .contact-sep { color: #6366F1; margin: 0 5px; font-weight: 700; }
        .creative-pulse .header-rule { height: 3px; background: linear-gradient(to right, #6366F1, #8B5CF6, transparent); margin: 0 32px; }

        /* Body */
        .creative-pulse .body-wrap { padding: 14px 32px 22px; }

        /* Section headers with left accent bar */
        .creative-pulse .section-header { display: flex; align-items: center; gap: 10px; margin: 12px 0 6px 0; }
        .creative-pulse .section-accent { width: 4px; height: 14px; background: linear-gradient(to bottom, #6366F1, #8B5CF6); border-radius: 2px; flex-shrink: 0; }
        .creative-pulse .section-label { font-size: 9px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; color: #111827; }

        /* Experience */
        .creative-pulse .job-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1px; }
        .creative-pulse .job-title { font-size: 11px; font-weight: 700; color: #111827; }
        .creative-pulse .job-company { font-size: 10px; color: #6366F1; font-weight: 500; }
        .creative-pulse .job-dates { font-size: 9.5px; color: #888; white-space: nowrap; margin-left: 6px; flex-shrink: 0; }
        .creative-pulse ul { margin: 3px 0 6px 13px; padding: 0; list-style: none; }
        .creative-pulse li { font-size: 10px; margin-bottom: 2px; line-height: 1.4; color: #374151; }
        .creative-pulse li::before { content: '▸'; color: #6366F1; font-size: 7px; margin-right: 5px; vertical-align: middle; }

        /* Summary */
        .creative-pulse .summary-text { font-size: 10px; line-height: 1.5; color: #374151; margin: 0; }

        /* Skills — pill style */
        .creative-pulse .skills-wrap { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 2px; }
        .creative-pulse .skill-pill {
          display: inline-block;
          font-size: 9px;
          font-weight: 600;
          color: #4338CA;
          background: rgba(99,102,241,0.08);
          border: 1px solid rgba(99,102,241,0.2);
          border-radius: 20px;
          padding: 1px 8px;
          letter-spacing: 0.02em;
        }
        /* ATS plain-text fallback — skills list also present as text */
        .creative-pulse .skills-plain { font-size: 10px; color: #374151; line-height: 1.6; display: none; }

        .creative-pulse .edu-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
        .creative-pulse .edu-degree { font-size: 11px; font-weight: 700; color: #111827; }
        .creative-pulse .edu-school { font-size: 10px; color: #6366F1; }
        .creative-pulse .edu-year { font-size: 9.5px; color: #888; white-space: nowrap; margin-left: 6px; flex-shrink: 0; }

        @media print {
          .creative-pulse { background-image: none !important; }
          .creative-pulse * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .creative-pulse .skills-plain { display: block; }
          .creative-pulse .skills-wrap { display: none; }
        }
      `}</style>
      <div className="creative-pulse" style={{ width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }} data-ats-field="resume-root">

        {/* Name block */}
        <div className="name-block" data-ats-field="header">
          <h1 data-ats-field="name">{personal.name || 'Your Name'}</h1>
          <p className="tagline">Creative Professional</p>
          <div className="contact-line" data-ats-field="contact">
            {[personal.email, personal.phone, personal.location, personal.linkedin_url, personal.website]
              .filter(Boolean)
              .map((v, i, arr) => (
                <span key={i}>
                  {v}{i < arr.length - 1 && <span className="contact-sep">✦</span>}
                </span>
              ))}
          </div>
        </div>
        <div className="header-rule" />

        {/* Body */}
        <div className="body-wrap">

          {/* Summary */}
          {data.summary && (
            <section data-ats-field="summary">
              <div className="section-header">
                <div className="section-accent" />
                <span className="section-label">About</span>
              </div>
              <p className="summary-text">{data.summary}</p>
            </section>
          )}

          {/* Experience */}
          {data.experience.length > 0 && (
            <section data-ats-field="experience">
              <div className="section-header">
                <div className="section-accent" />
                <span className="section-label">Experience</span>
              </div>
              {data.experience.map((exp) => (
                <article key={exp.id} style={{ marginBottom: '8px' }}>
                  <div className="job-header">
                    <div>
                      <span className="job-title">{exp.title}</span>
                      {exp.company && <span className="job-company">{' @ '}{exp.company}</span>}
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
                <div className="section-accent" />
                <span className="section-label">Education</span>
              </div>
              {data.education.map((edu) => (
                <div key={edu.id} className="edu-row">
                  <div>
                    <span className="edu-degree">{edu.degree} in {edu.field}</span>
                    <span className="edu-school">{', '}{edu.institution}</span>
                    {edu.gpa && <span className="edu-year" style={{ marginLeft: '8px' }}>GPA {edu.gpa}</span>}
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
                <div className="section-accent" />
                <span className="section-label">Leadership</span>
              </div>
              {data.leadership.map((item) => (
                <article key={item.id} style={{ marginBottom: '8px' }}>
                  <div className="job-header">
                    <div>
                      <span className="job-title">{item.role}</span>
                      {item.organization && <span className="job-company">{' @ '}{item.organization}</span>}
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
                <div className="section-accent" />
                <span className="section-label">Volunteer</span>
              </div>
              {data.volunteer.map((item) => (
                <article key={item.id} style={{ marginBottom: '7px' }}>
                  <div className="job-header">
                    <div>
                      <span className="job-title">{item.role}</span>
                      {item.organization && <span className="job-company">{' @ '}{item.organization}</span>}
                    </div>
                    <span className="job-dates">{item.date}</span>
                  </div>
                  {item.description && <p style={{ fontSize: '11px', color: '#374151', margin: '2px 0 0 0' }}>{item.description}</p>}
                </article>
              ))}
            </section>
          )}

          {/* Skills */}
          {data.skills.length > 0 && (
            <section data-ats-field="skills">
              <div className="section-header">
                <div className="section-accent" />
                <span className="section-label">Skills</span>
              </div>
              {/* Visual pill display */}
              <div className="skills-wrap" aria-hidden="true">
                {data.skills.map((skill, i) => (
                  <span key={i} className="skill-pill">{skill}</span>
                ))}
              </div>
              {/* ATS plain-text fallback (shown on print, hidden on screen) */}
              <p className="skills-plain">{data.skills.join(' · ')}</p>
            </section>
          )}

          {/* Certifications */}
          {data.certifications.length > 0 && (
            <section data-ats-field="certifications">
              <div className="section-header">
                <div className="section-accent" />
                <span className="section-label">Certifications</span>
              </div>
              <p style={{ fontSize: '11px', color: '#374151', lineHeight: '1.7' }}>{data.certifications.join(' · ')}</p>
            </section>
          )}

          {/* Languages */}
          {data.languages && data.languages.length > 0 && (
            <section data-ats-field="languages">
              <div className="section-header">
                <div className="section-accent" />
                <span className="section-label">Languages</span>
              </div>
              <div className="skills-wrap">
                {data.languages.map((lang) => (
                  <span key={lang.id} className="skill-pill">{lang.name} · {lang.proficiency}</span>
                ))}
              </div>
              <p className="skills-plain">{data.languages.map((l) => `${l.name} (${l.proficiency})`).join(' · ')}</p>
            </section>
          )}

          {/* Projects */}
          {data.projects.length > 0 && (
            <section data-ats-field="projects">
              <div className="section-header">
                <div className="section-accent" />
                <span className="section-label">Projects</span>
              </div>
              {data.projects.map((proj) => (
                <article key={proj.id} style={{ marginBottom: '7px' }}>
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
