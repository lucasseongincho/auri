import type { ResumeData } from '@/types'
import type { ReactNode } from 'react'

interface ClassicProProps {
  data: ResumeData
  personal: {
    name: string
    email: string
    phone: string
    location: string
    linkedin_url: string
    website: string
    github?: string
    portfolioLabel?: string
  }
  isEditing?: boolean
  /** Optional renderer for text fields — used to inject amber AI-estimate highlights. Defaults to identity. */
  renderText?: (text: string) => ReactNode
}

export default function ClassicPro({ data, personal, isEditing: _isEditing, renderText = (t) => t }: ClassicProProps) {
  const contactParts: ReactNode[] = []
  if (personal.email) contactParts.push(personal.email)
  if (personal.phone) contactParts.push(personal.phone)
  if (personal.location) contactParts.push(personal.location)
  if (personal.linkedin_url) contactParts.push(<a href={personal.linkedin_url} className="resume-link" target="_blank" rel="noopener noreferrer">LinkedIn</a>)
  if (personal.website) contactParts.push(<a href={personal.website} className="resume-link" target="_blank" rel="noopener noreferrer">{personal.portfolioLabel || 'Portfolio'}</a>)
  if (personal.github) contactParts.push(<a href={personal.github} className="resume-link" target="_blank" rel="noopener noreferrer">GitHub</a>)

  return (
    <>
      <style>{`
        .classic-pro {
          font-family: 'Times New Roman', Times, serif;
          color: #1a1a1a;
          background: white;
          width: 8.5in;
          min-height: 11in;
          box-sizing: border-box;
          padding: 18mm 20mm 16mm;
        }
        .classic-pro h1 {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: 0.02em;
          margin: 0 0 4px 0;
          text-align: center;
        }
        .classic-pro .contact-line {
          font-size: 10px;
          color: #444;
          text-align: center;
          margin-bottom: 10px;
          font-family: Arial, sans-serif;
          letter-spacing: 0.02em;
        }
        .classic-pro .section-header {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #1a1a1a;
          border-bottom: 1.5px solid #1a1a1a;
          padding-bottom: 2px;
          margin: 11px 0 6px 0;
          font-family: Arial, sans-serif;
        }
        .classic-pro .job-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 1px;
        }
        .classic-pro .job-title {
          font-size: 11px;
          font-weight: 700;
          font-family: Arial, sans-serif;
        }
        .classic-pro .job-company {
          font-size: 11px;
          font-style: italic;
        }
        .classic-pro .job-dates {
          font-size: 10px;
          color: #555;
          font-family: Arial, sans-serif;
          white-space: nowrap;
          margin-left: 8px;
          flex-shrink: 0;
        }
        .classic-pro ul {
          margin: 3px 0 7px 15px;
          padding: 0;
        }
        .classic-pro li {
          font-size: 10.5px;
          margin-bottom: 1.5px;
          line-height: 1.4;
        }
        .classic-pro .summary-text {
          font-size: 10.5px;
          line-height: 1.5;
          margin: 0;
        }
        .classic-pro .skills-list {
          font-size: 10.5px;
          line-height: 1.5;
        }
        .classic-pro .edu-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 4px;
        }
        .classic-pro .edu-degree {
          font-size: 11px;
          font-weight: 700;
          font-family: Arial, sans-serif;
        }
        .classic-pro .edu-school {
          font-size: 10.5px;
          font-style: italic;
        }
        .classic-pro .edu-year {
          font-size: 10px;
          color: #555;
          font-family: Arial, sans-serif;
          white-space: nowrap;
          flex-shrink: 0;
          margin-left: 8px;
        }
        .classic-pro .resume-link { color: inherit; text-decoration: underline; text-underline-offset: 2px; }
        @media print {
          .classic-pro { padding: 18mm 20mm 16mm !important; }
          .classic-pro * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .classic-pro .resume-link { color: inherit !important; text-decoration: underline !important; }
        }
      `}</style>
      <div className="classic-pro" data-ats-field="resume-root">

        {/* Header */}
        <header data-ats-field="header">
          <h1 data-ats-field="name">{personal.name || 'Your Name'}</h1>
          <div className="contact-line" data-ats-field="contact">
            {contactParts.map((part, i) => (
              <span key={i}>{i > 0 && ' · '}{part}</span>
            ))}
          </div>
        </header>

        {/* Summary */}
        {data.summary && (
          <section data-ats-field="summary">
            <div className="section-header">Summary</div>
            <p className="summary-text">{renderText(data.summary)}</p>
          </section>
        )}

        {/* Experience */}
        {data.experience.length > 0 && (
          <section data-ats-field="experience">
            <div className="section-header">Experience</div>
            {data.experience.slice(0, 3).map((exp) => (
              <article key={exp.id} style={{ marginBottom: '8px' }}>
                <div className="job-header">
                  <div>
                    <span className="job-title">{exp.title}</span>
                    {exp.company && <span className="job-company">, {exp.company}</span>}
                  </div>
                  <span className="job-dates">{exp.start} – {exp.end}</span>
                </div>
                <ul>
                  {exp.bullets.slice(0, 4).map((bullet, i) => (
                    <li key={i}>{renderText(bullet)}</li>
                  ))}
                </ul>
              </article>
            ))}
          </section>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <section data-ats-field="education">
            <div className="section-header">Education</div>
            {data.education.map((edu) => (
              <div key={edu.id} className="edu-row">
                <div>
                  <span className="edu-degree">{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</span>
                  <span className="edu-school">, {edu.institution}</span>
                  {edu.gpa && <span className="edu-school"> · GPA {edu.gpa}</span>}
                </div>
                <span className="edu-year">{edu.year}</span>
              </div>
            ))}
          </section>
        )}

        {/* Skills */}
        {data.skills.length > 0 && (
          <section data-ats-field="skills">
            <div className="section-header">Skills</div>
            <p className="skills-list">{data.skills.slice(0, 12).join(' · ')}</p>
          </section>
        )}

        {/* Certifications — only if present */}
        {data.certifications.length > 0 && (
          <section data-ats-field="certifications">
            <div className="section-header">Certifications</div>
            <p className="skills-list">{data.certifications.join(' · ')}</p>
          </section>
        )}

        {/* Projects — only if present */}
        {data.projects.length > 0 && (
          <section data-ats-field="projects">
            <div className="section-header">Projects</div>
            {data.projects.slice(0, 2).map((proj) => (
              <article key={proj.id} style={{ marginBottom: '6px' }}>
                <div className="job-header">
                  <span className="job-title">{proj.name}</span>
                  {proj.url && <span className="job-dates">{proj.url}</span>}
                </div>
                {proj.description && (
                  <p style={{ fontSize: '10.5px', margin: '1px 0 3px 0', lineHeight: 1.4 }}>{renderText(proj.description)}</p>
                )}
                {proj.bullets.length > 0 && (
                  <ul>
                    {proj.bullets.slice(0, 2).map((b, i) => <li key={i}>{renderText(b)}</li>)}
                  </ul>
                )}
              </article>
            ))}
          </section>
        )}

        {/* Leadership — only if present */}
        {data.leadership && data.leadership.length > 0 && (
          <section data-ats-field="leadership">
            <div className="section-header">Leadership</div>
            {data.leadership.slice(0, 2).map((item) => (
              <article key={item.id} style={{ marginBottom: '7px' }}>
                <div className="job-header">
                  <div>
                    <span className="job-title">{item.role}</span>
                    {item.organization && <span className="job-company">, {item.organization}</span>}
                  </div>
                  <span className="job-dates">{item.start} – {item.end}</span>
                </div>
                {item.bullets.length > 0 && (
                  <ul>
                    {item.bullets.map((b, i) => <li key={i}>{renderText(b)}</li>)}
                  </ul>
                )}
              </article>
            ))}
          </section>
        )}

        {/* Volunteer — only if present */}
        {data.volunteer && data.volunteer.length > 0 && (
          <section data-ats-field="volunteer">
            <div className="section-header">Volunteer</div>
            {data.volunteer.slice(0, 1).map((item) => (
              <article key={item.id} style={{ marginBottom: '6px' }}>
                <div className="job-header">
                  <div>
                    <span className="job-title">{item.role}</span>
                    {item.organization && <span className="job-company">, {item.organization}</span>}
                  </div>
                  <span className="job-dates">{item.date}</span>
                </div>
                {item.description && (
                  <p style={{ fontSize: '10.5px', margin: '1px 0 0 0', lineHeight: 1.4 }}>{item.description}</p>
                )}
              </article>
            ))}
          </section>
        )}

        {/* Languages — only if present */}
        {data.languages && data.languages.length > 0 && (
          <section data-ats-field="languages">
            <div className="section-header">Languages</div>
            <p className="skills-list">
              {data.languages.map((l) => `${l.name} (${l.proficiency})`).join(' · ')}
            </p>
          </section>
        )}
      </div>
    </>
  )
}
