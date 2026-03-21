import type { ResumeData } from '@/types'

interface MinimalSeoulProps {
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

export default function MinimalSeoul({ data, personal, isEditing }: MinimalSeoulProps) {
  return (
    <>
      <style>{`
        .minimal-seoul { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #111; background: white; }
        .minimal-seoul h1 { font-size: 32px; font-weight: 200; letter-spacing: 0.08em; margin: 0 0 6px 0; color: #0a0a0a; }
        .minimal-seoul .contact-line { font-size: 10px; color: #888; letter-spacing: 0.06em; margin-bottom: 32px; }
        .minimal-seoul .section-header { font-size: 9px; font-weight: 400; letter-spacing: 0.25em; text-transform: uppercase; color: #999; margin: 28px 0 12px 0; }
        .minimal-seoul .job-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
        .minimal-seoul .job-title { font-size: 12px; font-weight: 600; }
        .minimal-seoul .job-company { font-size: 11px; color: #555; margin-bottom: 2px; }
        .minimal-seoul .job-dates { font-size: 10px; color: #aaa; }
        .minimal-seoul ul { margin: 6px 0 12px 0; padding: 0; list-style: none; }
        .minimal-seoul li { font-size: 11px; color: #333; padding-left: 12px; position: relative; margin-bottom: 3px; line-height: 1.55; }
        .minimal-seoul li::before { content: '—'; position: absolute; left: 0; color: #bbb; font-weight: 200; }
        .minimal-seoul .summary-text { font-size: 11.5px; color: #333; line-height: 1.7; margin: 0; font-weight: 300; }
        .minimal-seoul .skills-text { font-size: 11px; color: #555; letter-spacing: 0.04em; line-height: 1.8; }
        .minimal-seoul .edu-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
        .minimal-seoul .edu-degree { font-size: 12px; font-weight: 500; }
        .minimal-seoul .edu-info { font-size: 10.5px; color: #777; }
        .minimal-seoul .divider { height: 1px; background: #f0f0f0; margin: 8px 0; }
        @media print {
          .minimal-seoul * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      <div
        className="minimal-seoul"
        style={{ padding: '48px 52px', minHeight: '297mm', width: '100%', boxSizing: 'border-box' }}
        data-ats-field="resume-root"
      >
        <header data-ats-field="header">
          <h1 data-ats-field="name">{personal.name || 'Your Name'}</h1>
          <div className="contact-line" data-ats-field="contact">
            {[personal.email, personal.phone, personal.location, personal.linkedin_url, personal.website]
              .filter(Boolean)
              .join('   ·   ')}
          </div>
        </header>

        {data.summary && (
          <section data-ats-field="summary">
            <div className="section-header">About</div>
            <p className="summary-text">{data.summary}</p>
          </section>
        )}

        {data.experience.length > 0 && (
          <section data-ats-field="experience">
            <div className="section-header">Experience</div>
            {data.experience.map((exp, idx) => (
              <article key={exp.id}>
                {idx > 0 && <div className="divider" />}
                <div className="job-row">
                  <div>
                    <div className="job-title">{exp.title}</div>
                    <div className="job-company">{exp.company}</div>
                  </div>
                  <div className="job-dates">{exp.start} – {exp.end}</div>
                </div>
                <ul>
                  {exp.bullets.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              </article>
            ))}
          </section>
        )}

        {data.education.length > 0 && (
          <section data-ats-field="education">
            <div className="section-header">Education</div>
            {data.education.map((edu) => (
              <div key={edu.id} className="edu-row">
                <div>
                  <span className="edu-degree">{edu.degree} in {edu.field}</span>
                  <div className="edu-info">{edu.institution}</div>
                </div>
                <div className="edu-info">{edu.year}</div>
              </div>
            ))}
          </section>
        )}

        {data.skills.length > 0 && (
          <section data-ats-field="skills">
            <div className="section-header">Skills</div>
            <p className="skills-text">{data.skills.join('   ·   ')}</p>
          </section>
        )}

        {data.certifications.length > 0 && (
          <section data-ats-field="certifications">
            <div className="section-header">Certifications</div>
            <p className="skills-text">{data.certifications.join('   ·   ')}</p>
          </section>
        )}

        {data.projects.length > 0 && (
          <section data-ats-field="projects">
            <div className="section-header">Projects</div>
            {data.projects.map((proj, idx) => (
              <article key={proj.id}>
                {idx > 0 && <div className="divider" />}
                <div className="job-row">
                  <span className="job-title">{proj.name}</span>
                  {proj.url && <span className="job-dates">{proj.url}</span>}
                </div>
                {proj.description && <p style={{ fontSize: '11px', color: '#555', margin: '2px 0 4px 0', fontWeight: 300 }}>{proj.description}</p>}
                {proj.bullets.length > 0 && (
                  <ul>{proj.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>
                )}
              </article>
            ))}
          </section>
        )}
      </div>
    </>
  )
}
