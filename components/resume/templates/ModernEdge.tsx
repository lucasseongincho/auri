import type { ResumeData } from '@/types'

interface ModernEdgeProps {
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

export default function ModernEdge({ data, personal, isEditing: _isEditing }: ModernEdgeProps) {
  return (
    <>
      <style>{`
        .modern-edge { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; background: white; display: flex; min-height: 297mm; width: 210mm; box-sizing: border-box; }
        .modern-edge .sidebar { width: 27%; background: #1e1b4b; color: white; padding: 22px 14px; flex-shrink: 0; }
        .modern-edge .main { flex: 1; padding: 22px 20px; }
        .modern-edge .name { font-size: 20px; font-weight: 900; color: white; margin: 0 0 2px 0; line-height: 1.1; }
        .modern-edge .role-label { font-size: 9px; color: #a5b4fc; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 14px; }
        .modern-edge .sidebar-section { margin-bottom: 13px; }
        .modern-edge .sidebar-header { font-size: 8px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #a5b4fc; border-bottom: 1px solid rgba(165,180,252,0.3); padding-bottom: 3px; margin-bottom: 6px; }
        .modern-edge .contact-item { font-size: 9px; color: #e0e7ff; margin-bottom: 3px; word-break: break-all; line-height: 1.4; }
        .modern-edge .skill-chip { display: inline-block; font-size: 9px; color: #c7d2fe; margin-bottom: 3px; padding: 1px 0; line-height: 1.4; }
        .modern-edge .main-section-header { font-size: 9px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #4338ca; border-bottom: 2px solid #6366f1; padding-bottom: 2px; margin: 10px 0 6px 0; }
        .modern-edge .job-title-row { display: flex; justify-content: space-between; align-items: baseline; }
        .modern-edge .job-title { font-size: 11px; font-weight: 700; }
        .modern-edge .job-dates { font-size: 9px; color: #6b7280; white-space: nowrap; margin-left: 6px; flex-shrink: 0; }
        .modern-edge .job-company { font-size: 10px; color: #4338ca; margin-bottom: 2px; }
        .modern-edge ul { margin: 2px 0 6px 13px; padding: 0; }
        .modern-edge li { font-size: 10px; margin-bottom: 1.5px; line-height: 1.4; }
        .modern-edge .summary-text { font-size: 10px; line-height: 1.5; margin: 0; }
        .modern-edge .edu-row { margin-bottom: 6px; }
        .modern-edge .edu-degree { font-size: 11px; font-weight: 700; }
        .modern-edge .edu-info { font-size: 10px; color: #555; }
        @media print {
          .modern-edge * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      <div className="modern-edge" data-ats-field="resume-root" style={{ width: '100%', boxSizing: 'border-box' }}>
        {/* Sidebar */}
        <aside className="sidebar" data-ats-field="sidebar">
          <div className="name" data-ats-field="name">{personal.name || 'Your Name'}</div>
          {data.experience[0] && (
            <div className="role-label">{data.experience[0].title}</div>
          )}

          <div className="sidebar-section" data-ats-field="contact">
            <div className="sidebar-header">Contact</div>
            {personal.email && <div className="contact-item">✉ {personal.email}</div>}
            {personal.phone && <div className="contact-item">📱 {personal.phone}</div>}
            {personal.location && <div className="contact-item">📍 {personal.location}</div>}
            {personal.linkedin_url && <div className="contact-item">in {personal.linkedin_url}</div>}
            {personal.website && <div className="contact-item">🌐 {personal.website}</div>}
          </div>

          {data.skills.length > 0 && (
            <div className="sidebar-section" data-ats-field="skills">
              <div className="sidebar-header">Skills</div>
              {data.skills.slice(0, 12).map((skill, i) => (
                <div key={i} className="skill-chip">{skill}</div>
              ))}
            </div>
          )}

          {data.certifications.length > 0 && (
            <div className="sidebar-section" data-ats-field="certifications">
              <div className="sidebar-header">Certifications</div>
              {data.certifications.slice(0, 3).map((cert, i) => (
                <div key={i} className="contact-item">{cert}</div>
              ))}
            </div>
          )}

          {data.languages && data.languages.length > 0 && (
            <div className="sidebar-section" data-ats-field="languages">
              <div className="sidebar-header">Languages</div>
              {data.languages.slice(0, 4).map((lang) => (
                <div key={lang.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#e0e7ff', marginBottom: '3px' }}>
                  <span>{lang.name}</span>
                  <span style={{ color: '#a5b4fc', fontStyle: 'italic' }}>{lang.proficiency}</span>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* Main */}
        <main className="main">
          {data.summary && (
            <section data-ats-field="summary">
              <div className="main-section-header">Profile</div>
              <p className="summary-text">{data.summary}</p>
            </section>
          )}

          {data.experience.length > 0 && (
            <section data-ats-field="experience">
              <div className="main-section-header">Experience</div>
              {data.experience.slice(0, 3).map((exp) => (
                <article key={exp.id} style={{ marginBottom: '10px' }}>
                  <div className="job-title-row">
                    <span className="job-title">{exp.title}</span>
                    <span className="job-dates">{exp.start} – {exp.end}</span>
                  </div>
                  <div className="job-company">{exp.company}</div>
                  <ul>
                    {exp.bullets.slice(0, 4).map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                </article>
              ))}
            </section>
          )}

          {data.education.length > 0 && (
            <section data-ats-field="education">
              <div className="main-section-header">Education</div>
              {data.education.map((edu) => (
                <div key={edu.id} className="edu-row">
                  <div className="edu-degree">{edu.degree} in {edu.field}</div>
                  <div className="edu-info">{edu.institution} · {edu.year}{edu.gpa ? ` · GPA ${edu.gpa}` : ''}</div>
                </div>
              ))}
            </section>
          )}

          {data.leadership && data.leadership.length > 0 && (
            <section data-ats-field="leadership">
              <div className="main-section-header">Leadership</div>
              {data.leadership.slice(0, 2).map((item) => (
                <article key={item.id} style={{ marginBottom: '10px' }}>
                  <div className="job-title-row">
                    <span className="job-title">{item.role}</span>
                    <span className="job-dates">{item.start} – {item.end}</span>
                  </div>
                  <div className="job-company">{item.organization}</div>
                  <ul>
                    {item.bullets.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                </article>
              ))}
            </section>
          )}

          {data.volunteer && data.volunteer.length > 0 && (
            <section data-ats-field="volunteer">
              <div className="main-section-header">Volunteer</div>
              {data.volunteer.slice(0, 1).map((item) => (
                <article key={item.id} style={{ marginBottom: '8px' }}>
                  <div className="job-title-row">
                    <div>
                      <span className="job-title">{item.role}</span>
                      {item.organization && <span className="job-company" style={{ marginLeft: '4px' }}> · {item.organization}</span>}
                    </div>
                    <span className="job-dates">{item.date}</span>
                  </div>
                  {item.description && <p style={{ fontSize: '11px', margin: '2px 0 0 0' }}>{item.description}</p>}
                </article>
              ))}
            </section>
          )}

          {data.projects.length > 0 && (
            <section data-ats-field="projects">
              <div className="main-section-header">Projects</div>
              {data.projects.slice(0, 2).map((proj) => (
                <article key={proj.id} style={{ marginBottom: '8px' }}>
                  <div className="job-title-row">
                    <span className="job-title">{proj.name}</span>
                    {proj.url && <span className="job-dates">{proj.url}</span>}
                  </div>
                  {proj.description && <p style={{ fontSize: '11px', margin: '2px 0 3px 0' }}>{proj.description}</p>}
                  {proj.bullets.length > 0 && (
                    <ul>{proj.bullets.slice(0, 2).map((b, i) => <li key={i}>{b}</li>)}</ul>
                  )}
                </article>
              ))}
            </section>
          )}
        </main>
      </div>
    </>
  )
}
