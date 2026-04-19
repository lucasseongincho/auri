import * as admin from 'firebase-admin'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const { FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY } = process.env

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: FIREBASE_ADMIN_PROJECT_ID!,
      clientEmail: FIREBASE_ADMIN_CLIENT_EMAIL!,
      privateKey: FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\n/g, '\n'),
    }),
  })
}

const db = admin.firestore()

async function main() {
  const uid = 'UGEYUbIbw4Tq46eTQcIqXQM2xH83'
  const resumeId = 'qa-test-amber-resume'
  
  const resume = {
    id: resumeId,
    name: 'QA Amber Test Resume',
    targetPosition: 'Senior Software Engineer',
    targetCompany: 'Acme Corp',
    templateId: 'classic-pro',
    atsScore: 78,
    personalInfo: {
      name: 'QA Tester',
      email: 'qa-test@auri-test.dev',
      phone: '555-123-4567',
      location: 'New York, NY',
      linkedin_url: '',
      website: ''
    },
    resumeData: {
      id: resumeId,
      summary: 'Software engineer with <ai-estimate>5+ years</ai-estimate> of experience building scalable systems. Reduced platform latency by <ai-estimate>40%</ai-estimate>.',
      experience: [{
        id: 'exp1',
        company: 'Acme Corp',
        title: 'Senior Software Engineer',
        start: '2021-01',
        end: 'Present',
        bullets: [
          'Led team of <ai-estimate>8 engineers</ai-estimate> to deliver product on schedule',
          'Improved API response time by <ai-estimate>35%</ai-estimate> through caching layer',
          'Managed <ai-estimate>$2M budget</ai-estimate> for cloud infrastructure'
        ]
      }],
      education: [{
        id: 'edu1',
        institution: 'State University',
        degree: 'B.S.',
        field: 'Computer Science',
        year: '2019'
      }],
      skills: ['TypeScript', 'React', 'Node.js', 'AWS'],
      certifications: [],
      projects: [],
      templateId: 'classic-pro',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }
  
  await db.doc(`users/${uid}/resumes/${resumeId}`).set(resume)
  console.log('Saved resume ID:', resumeId)
  console.log('URL: https://auri-beta.vercel.app/dashboard/resume/' + resumeId)
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
