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
import type { CareerProfile, SavedResume, SavedInterviewPrep, InterviewPrep } from '@/types'

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

export async function migrateGuestToFirestore(uid: string): Promise<void> {
  const guestProfile = getGuestProfile()
  if (!guestProfile) return
  const existing = await getCareerProfile(uid)
  const merged: CareerProfile = { ...guestProfile, ...existing }
  await saveCareerProfile(uid, merged)
  clearGuestProfile()
}
