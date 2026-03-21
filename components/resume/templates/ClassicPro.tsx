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

export default function ClassicPro({ data, personal, isEditing }: ClassicProProps) {
  return (
    <>
      <style>{`
        .classic-pro { font-family: 'Times New Roman', Times, serif; color: #1a1a1a; background: white; }
        .classic-pro h1 { font-size: 28px; font-weight: 700; letter-spacing: 0.02em; margin: 0 0 4px 0; }
        .classic-pro .contact-line { font-size: 11px; color: #555; margin-bottom: 16px; font-family: Arial, sans-serif; }
        .classic-pro .section-header { font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #1a1a1a; border-bottom: 1.5px solid #1a1a1a; padding-bottom: 3px; margin: 16px 0 8px 0; font-family: Arial, sans-serif; }
        .classic-pro .job-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px; }
        .classic-pro .job-title { font-size: 12px; font-weight: 700; font-family: Arial, sans-serif; }
        .classic-pro .job-company { font-size: 12px; font-style: italic; }
        .classic-pro .job-dates { font-size: 11px; color: #555; font-family: Arial, sans-serif; }
        .classic-pro ul { margin: 4px 0 8px 16px; padding: 0; }
        .classic-pro li { font-size: 11.5px; margin-bottom: 2px; line-height: 1.45; }
        .classic-pro .summary-text { font-size: 11.5px; line-height: 1.55; margin: 0; }
        .classic-pro .skills-list { font-size: 11.5px; line-height: 1.6; }
        .classic-pro .edu-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
        .classic-pro .edu-degree { font-size: 12px; font-weight: 700; font-family: Arial, sans-serif; }
        .classic-pro .edu-school { font-size: 11.5px; font-style: italic; }
        .classic-pro .edu-year { font-size: 11px; color: #555; font-family: Arial, sans-serif; }
        @media print {
          .classic-pro { padding: 0 !important; }
          .classic-pro * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      <div
        className="classic-pro"
        style={{ padding: '32px 40px', minHeight: '297mm', width: '100%', boxSizing: 'border-box' }}
        data-ats-field="resume-root"
      >
        {/* Header */}
        <header data-ats-field="header" style={{ textAlign: 'center', marginBottom: '4px' }}>
          <h1 data-ats-field="name">{personal.name || 'Your Name'}</h1>
          <div className="contact-line" data-ats-field="contact">
            {[personal.email, personal.phone, personal.location, personal.linkedin_url, personal.website]
              .filter(Boolean)
              .join(' · ')}
          </div>
        </header>

        {/* Summary */}
        {data.summary && (
          <section data-ats-field="summary">
            <div className="section-header">Summary</div>
            <p className="summary-text">{data.summary}</p>
          </section>
        )}

        {/* Experience */}
        {data.experience.length > 0 && (
          <section data-ats-field="experience">
            <div className="section-header">Experience</div>
            {data.experience.map((exp) => (
              <article key={exp.id} style={{ marginBottom: '10px' }}>
                <div className="job-header">
                  <div>
                    <span className="job-title">{exp.title}</span>
                    {exp.company && <span className="job-company">, {exp.company}</span>}
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
            <div className="section-header">Education</div>
            {data.education.map((edu) => (
              <div key={edu.id} className="edu-row">
                <div>
                  <span className="edu-degree">{edu.degree} in {edu.field}</span>
                  <span className="edu-school">, {edu.institution}</span>
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
            <p className="skills-list">{data.skills.join(' · ')}</p>
          </section>
        )}

        {/* Certifications */}
        {data.certifications.length > 0 && (
          <section data-ats-field="certifications">
            <div className="section-header">Certifications</div>
            <p className="skills-list">{data.certifications.join(' · ')}</p>
          </section>
        )}

        {/* Projects */}
        {data.projects.length > 0 && (
          <section data-ats-field="projects">
            <div className="section-header">Projects</div>
            {data.projects.map((proj) => (
              <article key={proj.id} style={{ marginBottom: '8px' }}>
                <div className="job-header">
                  <span className="job-title">{proj.name}</span>
                  {proj.url && <span className="job-dates">{proj.url}</span>}
                </div>
                {proj.description && <p style={{ fontSize: '11.5px', margin: '2px 0 4px 0' }}>{proj.description}</p>}
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
    </>
  )
}
