import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { CareerProfile, SavedResume, SavedInterviewPrep, InterviewPrep, SavedCoverLetter, SavedStrategy, JobStrategy } from '@/types'

// ── User Profile Bootstrap ────────────────────────────────────────────────────
// Called on sign-up and Google sign-in to persist auth metadata to Firestore.
// Uses merge: true + field-existence check so existing data is never overwritten.

export async function ensureUserProfileFields(uid: string, fields: {
  email?: string | null
  displayName?: string | null
  marketingConsent?: boolean
}): Promise<void> {
  const ref = doc(db, 'users', uid, 'profile', 'data')
  const snap = await getDoc(ref)
  const existing = snap.exists() ? snap.data() : {}

  const updates: Record<string, unknown> = {}
  if (fields.email && !existing['email']) updates['email'] = fields.email
  if (fields.displayName && !existing['displayName']) updates['displayName'] = fields.displayName
  if (fields.marketingConsent !== undefined && !('marketingConsent' in existing)) {
    updates['marketingConsent'] = fields.marketingConsent
    if (fields.marketingConsent) updates['marketingConsentAt'] = serverTimestamp()
  }
  if (!snap.exists()) updates['createdAt'] = serverTimestamp()

  if (Object.keys(updates).length > 0) {
    await setDoc(ref, updates, { merge: true })
  }
}

// ── Career Profile ─────────────────────────────────────────────────────────────

export async function getCareerProfile(uid: string): Promise<CareerProfile | null> {
  const ref = doc(db, 'users', uid, 'profile', 'data')
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return snap.data() as CareerProfile
}

export async function saveCareerProfile(uid: string, profile: CareerProfile): Promise<void> {
  const ref = doc(db, 'users', uid, 'profile', 'data')
  await setDoc(ref, { ...profile, updatedAt: serverTimestamp() }, { merge: true })
}

export async function updateCareerProfile(uid: string, partial: Partial<CareerProfile>): Promise<void> {
  const ref = doc(db, 'users', uid, 'profile', 'data')
  await updateDoc(ref, { ...partial, updatedAt: serverTimestamp() })
}

// ── Saved Resumes — users/{uid}/resumes/{resumeId} ────────────────────────────

export async function getSavedResumes(uid: string): Promise<SavedResume[]> {
  const col = collection(db, 'users', uid, 'resumes')
  const q = query(col, orderBy('updatedAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SavedResume))
}

export async function getSavedResume(uid: string, resumeId: string): Promise<SavedResume | null> {
  const ref = doc(db, 'users', uid, 'resumes', resumeId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as SavedResume
}

export async function saveResume(uid: string, resume: Omit<SavedResume, 'id'>): Promise<string> {
  const col = collection(db, 'users', uid, 'resumes')
  const newRef = doc(col)
  // Strip undefined fields — Firestore rejects documents containing undefined values
  const sanitized = JSON.parse(JSON.stringify(resume))
  await setDoc(newRef, { ...sanitized, updatedAt: serverTimestamp() })
  return newRef.id
}

export async function updateSavedResume(uid: string, resumeId: string, partial: Partial<SavedResume>): Promise<void> {
  const ref = doc(db, 'users', uid, 'resumes', resumeId)
  await updateDoc(ref, { ...partial, updatedAt: serverTimestamp() })
}

export async function deleteSavedResume(uid: string, resumeId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'resumes', resumeId)
  await deleteDoc(ref)
}

// ── Interview Prep — users/{uid}/interview-prep/{prepId} ─────────────────────

export async function getSavedInterviewPreps(uid: string): Promise<SavedInterviewPrep[]> {
  const col = collection(db, 'users', uid, 'interview-prep')
  const q = query(col, orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SavedInterviewPrep))
}

export async function saveInterviewPrep(
  uid: string,
  position: string,
  company: string,
  prep: InterviewPrep
): Promise<string> {
  const col = collection(db, 'users', uid, 'interview-prep')
  const newRef = doc(col)
  await setDoc(newRef, {
    position,
    company,
    prep,
    createdAt: new Date().toISOString(),
  })
  return newRef.id
}

export async function deleteInterviewPrep(uid: string, prepId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'interview-prep', prepId)
  await deleteDoc(ref)
}

// ── Single interview prep lookup ──────────────────────────────────────────────

export async function getSavedInterviewPrep(uid: string, prepId: string): Promise<SavedInterviewPrep | null> {
  const ref = doc(db, 'users', uid, 'interview-prep', prepId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as SavedInterviewPrep
}

// ── Cover Letters — users/{uid}/cover-letters/{id} ───────────────────────────

export async function getSavedCoverLetters(uid: string): Promise<SavedCoverLetter[]> {
  const col = collection(db, 'users', uid, 'cover-letters')
  const q = query(col, orderBy('updatedAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SavedCoverLetter))
}

export async function getSavedCoverLetter(uid: string, id: string): Promise<SavedCoverLetter | null> {
  const ref = doc(db, 'users', uid, 'cover-letters', id)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as SavedCoverLetter
}

export async function saveCoverLetter(uid: string, letter: Omit<SavedCoverLetter, 'id'>): Promise<string> {
  const col = collection(db, 'users', uid, 'cover-letters')
  const newRef = doc(col)
  const sanitized = JSON.parse(JSON.stringify(letter))
  await setDoc(newRef, { ...sanitized, updatedAt: serverTimestamp() })
  return newRef.id
}

export async function updateCoverLetter(uid: string, id: string, partial: Partial<SavedCoverLetter>): Promise<void> {
  const ref = doc(db, 'users', uid, 'cover-letters', id)
  await updateDoc(ref, { ...partial, updatedAt: serverTimestamp() })
}

export async function deleteCoverLetter(uid: string, id: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'cover-letters', id)
  await deleteDoc(ref)
}

// ── localStorage helpers for guest users ─────────────────────────────────────

const GUEST_STORAGE_KEY = 'auri_guest_profile'

export function getGuestProfile(): CareerProfile | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(GUEST_STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    // Zustand persist wraps state as { state: { profile, ... }, version: 0 }
    if (parsed?.state?.profile) return parsed.state.profile as CareerProfile
    // Fallback: raw CareerProfile (legacy format before Zustand persist was added)
    return parsed as CareerProfile
  } catch {
    return null
  }
}

export function saveGuestProfile(profile: CareerProfile): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(profile))
}

export function clearGuestProfile(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(GUEST_STORAGE_KEY)
}

// ── Migration: localStorage → Firestore on sign-in ───────────────────────────

// ── Guest interview prep (localStorage) ──────────────────────────────────────

const GUEST_INTERVIEW_KEY = 'auri_guest_interview_preps'

export function getGuestInterviewPreps(): SavedInterviewPrep[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(GUEST_INTERVIEW_KEY)
  if (!raw) return []
  try { return JSON.parse(raw) as SavedInterviewPrep[] } catch { return [] }
}

export function saveGuestInterviewPrep(
  position: string,
  company: string,
  prep: InterviewPrep
): string {
  if (typeof window === 'undefined') return ''
  const preps = getGuestInterviewPreps()
  const id = `guest_${Date.now()}`
  preps.unshift({ id, position, company, prep, createdAt: new Date().toISOString() })
  localStorage.setItem(GUEST_INTERVIEW_KEY, JSON.stringify(preps))
  return id
}

export function deleteGuestInterviewPrep(id: string): void {
  if (typeof window === 'undefined') return
  const preps = getGuestInterviewPreps().filter((p) => p.id !== id)
  localStorage.setItem(GUEST_INTERVIEW_KEY, JSON.stringify(preps))
}

export async function migrateGuestInterviewPrepsToFirestore(uid: string): Promise<void> {
  const preps = getGuestInterviewPreps()
  if (preps.length === 0) return
  await Promise.all(preps.map((p) => saveInterviewPrep(uid, p.position, p.company, p.prep)))
  localStorage.removeItem(GUEST_INTERVIEW_KEY)
}

// ── Job Strategies ────────────────────────────────────────────────────────────

export async function saveStrategy(
  uid: string,
  position: string,
  industry: string,
  city: string,
  strategy: JobStrategy
): Promise<string> {
  const ref = doc(collection(db, `users/${uid}/strategies`))
  await setDoc(ref, {
    position,
    industry,
    city,
    strategy,
    completed: {},
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function getSavedStrategies(uid: string): Promise<SavedStrategy[]> {
  const snap = await getDocs(
    query(
      collection(db, `users/${uid}/strategies`),
      orderBy('createdAt', 'desc')
    )
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SavedStrategy))
}

export async function getSavedStrategy(
  uid: string,
  strategyId: string
): Promise<SavedStrategy | null> {
  const snap = await getDoc(doc(db, `users/${uid}/strategies/${strategyId}`))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as SavedStrategy
}

export async function deleteStrategy(uid: string, strategyId: string): Promise<void> {
  await deleteDoc(doc(db, `users/${uid}/strategies/${strategyId}`))
}

export async function updateStrategyCompleted(
  uid: string,
  strategyId: string,
  completed: Record<string, boolean>
): Promise<void> {
  await updateDoc(doc(db, `users/${uid}/strategies/${strategyId}`), { completed })
}

// ── Guest strategies (localStorage) ──────────────────────────────────────────

const GUEST_STRATEGIES_KEY = 'auri_guest_strategies'

export function getGuestStrategies(): SavedStrategy[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(GUEST_STRATEGIES_KEY)
  if (!raw) return []
  try { return JSON.parse(raw) as SavedStrategy[] } catch { return [] }
}

export function saveGuestStrategy(
  position: string,
  industry: string,
  city: string,
  strategy: JobStrategy
): string {
  if (typeof window === 'undefined') return ''
  const strategies = getGuestStrategies()
  const id = `guest_${Date.now()}`
  const full: SavedStrategy = {
    id,
    position,
    industry,
    city,
    strategy,
    completed: {},
    createdAt: new Date().toISOString(),
  }
  strategies.unshift(full)
  localStorage.setItem(GUEST_STRATEGIES_KEY, JSON.stringify(strategies.slice(0, 10)))
  return id
}

export function deleteGuestStrategy(id: string): void {
  if (typeof window === 'undefined') return
  const strategies = getGuestStrategies().filter((s) => s.id !== id)
  localStorage.setItem(GUEST_STRATEGIES_KEY, JSON.stringify(strategies))
}

export async function migrateGuestStrategiesToFirestore(uid: string): Promise<void> {
  const strategies = getGuestStrategies()
  if (strategies.length === 0) return
  await Promise.all(
    strategies.map((s) => saveStrategy(uid, s.position, s.industry, s.city, s.strategy))
  )
  localStorage.removeItem(GUEST_STRATEGIES_KEY)
}

export async function migrateGuestToFirestore(uid: string): Promise<void> {
  const guestProfile = getGuestProfile()
  if (!guestProfile) return
  const existing = await getCareerProfile(uid)
  const merged: CareerProfile = { ...guestProfile, ...existing }
  await saveCareerProfile(uid, merged)
  clearGuestProfile()
}

// ── Guest cover letters (localStorage) ───────────────────────────────────────

const GUEST_COVER_LETTERS_KEY = 'auri_guest_cover_letters'

export function getGuestCoverLetters(): SavedCoverLetter[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(GUEST_COVER_LETTERS_KEY)
  if (!raw) return []
  try { return JSON.parse(raw) as SavedCoverLetter[] } catch { return [] }
}

export function saveGuestCoverLetter(
  letter: Omit<SavedCoverLetter, 'id'>
): string {
  if (typeof window === 'undefined') return ''
  const letters = getGuestCoverLetters()
  const id = `guest_${Date.now()}`
  const full: SavedCoverLetter = {
    ...letter,
    id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  letters.unshift(full)
  // Keep max 10 guest cover letters
  localStorage.setItem(
    GUEST_COVER_LETTERS_KEY,
    JSON.stringify(letters.slice(0, 10))
  )
  return id
}

export function deleteGuestCoverLetter(id: string): void {
  if (typeof window === 'undefined') return
  const letters = getGuestCoverLetters().filter((l) => l.id !== id)
  localStorage.setItem(GUEST_COVER_LETTERS_KEY, JSON.stringify(letters))
}

export async function migrateGuestCoverLettersToFirestore(
  uid: string
): Promise<void> {
  const letters = getGuestCoverLetters()
  if (letters.length === 0) return
  await Promise.all(
    letters.map((l) => {
      const { id: _id, ...rest } = l
      return saveCoverLetter(uid, rest)
    })
  )
  localStorage.removeItem(GUEST_COVER_LETTERS_KEY)
}
