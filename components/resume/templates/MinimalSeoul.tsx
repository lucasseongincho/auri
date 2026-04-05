import type { ResumeData } from '@/types'
import type { ReactNode } from 'react'

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
  renderText?: (text: string) => ReactNode
}

export default function MinimalSeoul({ data, personal, isEditing: _isEditing, renderText = (t) => t }: MinimalSeoulProps) {
  return (
    <>
      <style>{`
        .minimal-seoul { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #111; background: white; width: 210mm; min-height: 297mm; box-sizing: border-box; }
        .minimal-seoul h1 { font-size: 26px; font-weight: 200; letter-spacing: 0.08em; margin: 0 0 5px 0; color: #0a0a0a; }
        .minimal-seoul .contact-line { font-size: 9.5px; color: #888; letter-spacing: 0.06em; margin-bottom: 20px; }
        .minimal-seoul .section-header { font-size: 8.5px; font-weight: 400; letter-spacing: 0.25em; text-transform: uppercase; color: #999; margin: 18px 0 8px 0; }
        .minimal-seoul .job-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
        .minimal-seoul .job-title { font-size: 11px; font-weight: 600; }
        .minimal-seoul .job-company { font-size: 10px; color: #555; margin-bottom: 1px; }
        .minimal-seoul .job-dates { font-size: 9.5px; color: #aaa; white-space: nowrap; margin-left: 6px; flex-shrink: 0; }
        .minimal-seoul ul { margin: 4px 0 8px 0; padding: 0; list-style: none; }
        .minimal-seoul li { font-size: 10px; color: #333; padding-left: 12px; position: relative; margin-bottom: 2px; line-height: 1.45; }
        .minimal-seoul li::before { content: '—'; position: absolute; left: 0; color: #bbb; font-weight: 200; }
        .minimal-seoul .summary-text { font-size: 10px; color: #333; line-height: 1.55; margin: 0; font-weight: 300; }
        .minimal-seoul .skills-text { font-size: 10px; color: #555; letter-spacing: 0.04em; line-height: 1.6; }
        .minimal-seoul .edu-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 5px; }
        .minimal-seoul .edu-degree { font-size: 11px; font-weight: 500; }
        .minimal-seoul .edu-info { font-size: 9.5px; color: #777; }
        .minimal-seoul .divider { height: 1px; background: #f0f0f0; margin: 5px 0; }
        @media print {
          .minimal-seoul * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      <div
        className="minimal-seoul"
        style={{ padding: '28px 36px 24px' }}
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
            <p className="summary-text">{renderText(data.summary)}</p>
          </section>
        )}

        {data.experience.length > 0 && (
          <section data-ats-field="experience">
            <div className="section-header">Experience</div>
            {data.experience.slice(0, 3).map((exp, idx) => (
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
                  {exp.bullets.slice(0, 4).map((b, i) => <li key={i}>{renderText(b)}</li>)}
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
                  <div className="edu-info">{edu.institution}{edu.gpa ? ` · GPA ${edu.gpa}` : ''}</div>
                </div>
                <div className="edu-info">{edu.year}</div>
              </div>
            ))}
          </section>
        )}

        {data.leadership && data.leadership.length > 0 && (
          <section data-ats-field="leadership">
            <div className="section-header">Leadership</div>
            {data.leadership.slice(0, 2).map((item, idx) => (
              <article key={item.id}>
                {idx > 0 && <div className="divider" />}
                <div className="job-row">
                  <div>
                    <div className="job-title">{item.role}</div>
                    <div className="job-company">{item.organization}</div>
                  </div>
                  <div className="job-dates">{item.start} – {item.end}</div>
                </div>
                <ul>
                  {item.bullets.map((b, i) => <li key={i}>{renderText(b)}</li>)}
                </ul>
              </article>
            ))}
          </section>
        )}

        {data.volunteer && data.volunteer.length > 0 && (
          <section data-ats-field="volunteer">
            <div className="section-header">Volunteer</div>
            {data.volunteer.slice(0, 1).map((item, idx) => (
              <article key={item.id}>
                {idx > 0 && <div className="divider" />}
                <div className="job-row">
                  <div>
                    <div className="job-title">{item.role}</div>
                    <div className="job-company">{item.organization}</div>
                  </div>
                  <div className="job-dates">{item.date}</div>
                </div>
                {item.description && <p style={{ fontSize: '11px', color: '#555', margin: '2px 0 8px 0', fontWeight: 300 }}>{item.description}</p>}
              </article>
            ))}
          </section>
        )}

        {data.skills.length > 0 && (
          <section data-ats-field="skills">
            <div className="section-header">Skills</div>
            <p className="skills-text">{data.skills.slice(0, 12).join('   ·   ')}</p>
          </section>
        )}

        {data.certifications.length > 0 && (
          <section data-ats-field="certifications">
            <div className="section-header">Certifications</div>
            <p className="skills-text">{data.certifications.slice(0, 3).join('   ·   ')}</p>
          </section>
        )}

        {data.languages && data.languages.length > 0 && (
          <section data-ats-field="languages">
            <div className="section-header">Languages</div>
            <p className="skills-text">
              {data.languages.slice(0, 4).map((l) => `${l.name} — ${l.proficiency}`).join('   ·   ')}
            </p>
          </section>
        )}

        {data.projects.length > 0 && (
          <section data-ats-field="projects">
            <div className="section-header">Projects</div>
            {data.projects.slice(0, 2).map((proj, idx) => (
              <article key={proj.id}>
                {idx > 0 && <div className="divider" />}
                <div className="job-row">
                  <span className="job-title">{proj.name}</span>
                  {proj.url && <span className="job-dates">{proj.url}</span>}
                </div>
                {proj.description && <p style={{ fontSize: '11px', color: '#555', margin: '2px 0 4px 0', fontWeight: 300 }}>{renderText(proj.description)}</p>}
                {proj.bullets.length > 0 && (
                  <ul>{proj.bullets.slice(0, 2).map((b, i) => <li key={i}>{renderText(b)}</li>)}</ul>
                )}
              </article>
            ))}
          </section>
        )}
      </div>
    </>
  )
}
