// Server-side only — uses Firebase Admin SDK.
// Called by all /api/claude/* routes to enforce beta limits.

import { adminDb } from '@/lib/firebaseAdmin'
import { APP_CONFIG } from '@/lib/config'
import { FieldValue } from 'firebase-admin/firestore'

export interface BetaGuardResult {
  allowed: boolean
  status?: number
  body?: Record<string, unknown>
}

// ── Week boundary helpers ──────────────────────────────────────────────────────

/** Returns the most recent Monday at 00:00:00 UTC */
function getThisMonday(): Date {
  const now = new Date()
  const day = now.getUTCDay() // 0 = Sunday, 1 = Monday ...
  const daysBack = day === 0 ? 6 : day - 1
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() - daysBack)
  monday.setUTCHours(0, 0, 0, 0)
  return monday
}

/** Returns next Monday formatted as "Monday, April 7" */
function getNextMondayString(): string {
  const now = new Date()
  const day = now.getUTCDay()
  const daysUntilMonday = day === 0 ? 1 : 8 - day
  const nextMonday = new Date(now)
  nextMonday.setUTCDate(now.getUTCDate() + daysUntilMonday)
  nextMonday.setUTCHours(0, 0, 0, 0)
  return nextMonday.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

// ── Main beta guard ───────────────────────────────────────────────────────────

/**
 * Checks beta access (approved + weekly limit) for a given uid.
 * Reads from:
 *   users/{uid}/profile/data  → betaApproved
 *   users/{uid}/betaUsage/data → betaCallsThisWeek, betaWeekStart
 *
 * Auto-resets the weekly counter when a new Monday has started.
 * Returns { allowed: true } when the request can proceed.
 */
export async function checkBetaLimits(uid: string, email?: string): Promise<BetaGuardResult> {
  if (!adminDb) return { allowed: true } // Admin SDK not configured (local dev)

  // Owner is always exempt from all beta limits
  const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL
  if (ownerEmail && email && email === ownerEmail) {
    return { allowed: true }
  }

  // 1. Check betaApproved
  const profileSnap = await adminDb.doc(`users/${uid}/profile/data`).get()
  const betaApproved = profileSnap.exists ? profileSnap.data()?.betaApproved === true : false

  if (!betaApproved) {
    return {
      allowed: false,
      status: 403,
      body: {
        success: false,
        error: 'BETA_ACCESS_REQUIRED',
        message: 'You need a valid invite code to use AURI during beta.',
      },
    }
  }

  // 2. Read usage document
  const usageRef = adminDb.doc(`users/${uid}/betaUsage/data`)
  const usageSnap = await usageRef.get()
  const usageData = usageSnap.exists ? usageSnap.data()! : {}

  const thisMonday = getThisMonday()
  const storedWeekStart: Date | null = usageData.betaWeekStart?.toDate?.() ?? null
  const needsReset = !storedWeekStart || storedWeekStart < thisMonday

  let callsThisWeek: number = usageData.betaCallsThisWeek ?? 0

  if (needsReset) {
    // Reset counter — new week started
    await usageRef.set(
      {
        betaCallsThisWeek: 0,
        betaWeekStart: thisMonday,
      },
      { merge: true }
    )
    callsThisWeek = 0
  }

  // 3. Enforce weekly limit
  if (callsThisWeek >= APP_CONFIG.BETA_WEEKLY_CALL_LIMIT) {
    return {
      allowed: false,
      status: 429,
      body: {
        success: false,
        error: 'BETA_LIMIT_REACHED',
        message: `You have used all ${APP_CONFIG.BETA_WEEKLY_CALL_LIMIT} beta calls this week.`,
        resetsOn: getNextMondayString(),
        callsUsed: callsThisWeek,
        callsTotal: APP_CONFIG.BETA_WEEKLY_CALL_LIMIT,
      },
    }
  }

  return { allowed: true }
}

/**
 * Increments the weekly call counter for a user.
 * Uses Firestore FieldValue.increment to avoid race conditions.
 */
export async function incrementBetaCall(uid: string): Promise<void> {
  if (!adminDb) return
  const usageRef = adminDb.doc(`users/${uid}/betaUsage/data`)
  await usageRef.set(
    { betaCallsThisWeek: FieldValue.increment(1) },
    { merge: true }
  )
}
