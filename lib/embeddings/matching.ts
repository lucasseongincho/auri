// Server-side matching logic. No LLM calls — pure math + text parsing.
import type { CareerProfile, RequirementCoverage } from '@/types'

export function parseJDRequirements(jd: string): string[] {
  const raw = jd
    .replace(/([.!?])\s+/g, '$1\n')
    .split('\n')
    .map((s) => s.replace(/^[\s\-•·*▪▶]+/, '').trim())
    .filter((s) => s.length >= 10)
  return [...new Set(raw)]
}

export function flattenResumeBullets(profile: CareerProfile): string[] {
  const bullets: string[] = []

  for (const exp of profile.experience ?? []) {
    for (const b of exp.bullets ?? []) {
      const t = b.trim()
      if (t.length >= 10) bullets.push(t)
    }
  }

  for (const skill of profile.skills ?? []) {
    const t = skill.trim()
    if (t.length >= 10) bullets.push(t)
  }

  for (const proj of profile.projects ?? []) {
    const desc = proj.description?.trim()
    if (desc && desc.length >= 10) bullets.push(desc)
    for (const b of proj.bullets ?? []) {
      const t = b.trim()
      if (t.length >= 10) bullets.push(t)
    }
  }

  for (const lead of profile.leadership ?? []) {
    for (const b of lead.bullets ?? []) {
      const t = b.trim()
      if (t.length >= 10) bullets.push(t)
    }
  }

  return bullets
}

function dotProduct(a: number[], b: number[]): number {
  return a.reduce((sum, val, i) => sum + val * b[i], 0)
}

function statusFromScore(score: number): 'strong' | 'partial' | 'missing' {
  if (score > 0.75) return 'strong'
  if (score >= 0.5) return 'partial'
  return 'missing'
}

export function computeCoverage(
  jdRequirements: string[],
  jdVectors: number[][],
  resumeBullets: string[],
  resumeVectors: number[][]
): RequirementCoverage[] {
  return jdRequirements.map((requirement, reqIdx) => {
    const reqVec = jdVectors[reqIdx]
    if (!reqVec) {
      return { requirement, bestMatch: null, score: 0, status: 'missing' as const }
    }

    let bestScore = 0
    let bestMatch: string | null = null

    for (let i = 0; i < resumeBullets.length; i++) {
      const bVec = resumeVectors[i]
      if (!bVec) continue
      const s = dotProduct(reqVec, bVec)
      if (s > bestScore) {
        bestScore = s
        bestMatch = resumeBullets[i]
      }
    }

    return {
      requirement,
      bestMatch,
      score: bestScore,
      status: statusFromScore(bestScore),
    }
  })
}
