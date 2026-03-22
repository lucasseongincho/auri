import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CareerProfile, ResumeData, ATSScore, TemplateId, FeatureId, EditHistoryEntry } from '@/types'
import { saveCareerProfile, getCareerProfile } from '@/lib/firestore'

const DEFAULT_PROFILE: CareerProfile = {
  personal: { name: '', email: '', phone: '', location: '', linkedin_url: '', website: '' },
  experience: [],
  education: [],
  skills: [],
  certifications: [],
  projects: [],
  target: { position: '', company: '', company_type: '', industry: '', city: '', job_description: '' },
  generated: {
    resume_html: '',
    resume_plain: '',
    ats_score: null,
    cover_letter: '',
    linkedin_rewrite: {},
    job_strategy: {},
    interview_prep: {},
  },
}

const MAX_HISTORY = 50 // max undo steps

interface CareerStore {
  profile: CareerProfile | null
  currentResume: ResumeData | null
  selectedTemplate: TemplateId
  atsScore: ATSScore | null
  isGenerating: boolean
  activeFeature: FeatureId
  isSyncing: boolean
  syncError: string | null

  // Undo/redo history for Easy Tune edits
  editHistory: EditHistoryEntry[]
  historyIndex: number

  // Actions
  updateProfile: (partial: Partial<CareerProfile>) => void
  setProfile: (profile: CareerProfile) => void
  setResume: (resume: ResumeData) => void
  setATSScore: (score: ATSScore) => void
  setSelectedTemplate: (id: TemplateId) => void
  setIsGenerating: (val: boolean) => void
  setActiveFeature: (id: FeatureId) => void
  resetProfile: () => void
  clearStore: () => void

  // Easy Tune history
  pushToHistory: (resume: ResumeData) => void
  undo: () => ResumeData | null
  redo: () => ResumeData | null
  canUndo: () => boolean
  canRedo: () => boolean

  // Firestore sync
  syncToFirestore: (uid: string) => Promise<void>
  loadFromFirestore: (uid: string) => Promise<void>
}

let syncTimer: ReturnType<typeof setTimeout> | null = null

export const useCareerStore = create<CareerStore>()(
  persist(
    (set, get) => ({
      profile: DEFAULT_PROFILE,
      currentResume: null,
      selectedTemplate: 'classic-pro',
      atsScore: null,
      isGenerating: false,
      activeFeature: 'dashboard',
      isSyncing: false,
      syncError: null,
      editHistory: [],
      historyIndex: -1,

      updateProfile: (partial) => {
        set((state) => ({
          profile: state.profile
            ? { ...state.profile, ...partial }
            : { ...DEFAULT_PROFILE, ...partial },
        }))
      },

      setProfile: (profile) => set({ profile }),

      setResume: (resume) => {
        set({ currentResume: resume })
      },

      setATSScore: (score) => {
        set((state) => ({
          atsScore: score,
          profile: state.profile
            ? { ...state.profile, generated: { ...state.profile.generated, ats_score: score } }
            : state.profile,
        }))
      },

      setSelectedTemplate: (id) => set({ selectedTemplate: id }),
      setIsGenerating: (val) => set({ isGenerating: val }),
      setActiveFeature: (id) => set({ activeFeature: id }),
      resetProfile: () => set({
        profile: DEFAULT_PROFILE,
        currentResume: null,
        atsScore: null,
        editHistory: [],
        historyIndex: -1,
      }),
      clearStore: () => set({
        profile: null,
        currentResume: null,
        atsScore: null,
        editHistory: [],
        historyIndex: -1,
      }),

      // Push a resume snapshot onto the undo stack
      pushToHistory: (resume) => {
        set((state) => {
          // Truncate redo branch when new edit is made
          const trimmed = state.editHistory.slice(0, state.historyIndex + 1)
          const entry: EditHistoryEntry = { resumeData: resume, timestamp: Date.now() }
          const newHistory = [...trimmed, entry].slice(-MAX_HISTORY)
          return {
            editHistory: newHistory,
            historyIndex: newHistory.length - 1,
            currentResume: resume,
          }
        })
      },

      undo: () => {
        const { editHistory, historyIndex } = get()
        if (historyIndex <= 0) return null
        const newIndex = historyIndex - 1
        const entry = editHistory[newIndex]
        set({ historyIndex: newIndex, currentResume: entry.resumeData })
        return entry.resumeData
      },

      redo: () => {
        const { editHistory, historyIndex } = get()
        if (historyIndex >= editHistory.length - 1) return null
        const newIndex = historyIndex + 1
        const entry = editHistory[newIndex]
        set({ historyIndex: newIndex, currentResume: entry.resumeData })
        return entry.resumeData
      },

      canUndo: () => get().historyIndex > 0,
      canRedo: () => get().historyIndex < get().editHistory.length - 1,

      syncToFirestore: async (uid) => {
        if (syncTimer) clearTimeout(syncTimer)
        syncTimer = setTimeout(async () => {
          const { profile } = get()
          if (!profile) return
          set({ isSyncing: true, syncError: null })
          try {
            await saveCareerProfile(uid, profile)
          } catch (err) {
            set({ syncError: err instanceof Error ? err.message : 'Sync failed' })
          } finally {
            set({ isSyncing: false })
          }
        }, 2000)
      },

      loadFromFirestore: async (uid) => {
        set({ isSyncing: true, syncError: null })
        try {
          const profile = await getCareerProfile(uid)
          if (profile) set({ profile })
        } catch (err) {
          set({ syncError: err instanceof Error ? err.message : 'Load failed' })
        } finally {
          set({ isSyncing: false })
        }
      },
    }),
    {
      name: 'auri_guest_profile',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : ({} as Storage)
      ),
      // Don't persist edit history — only persists active data
      partialize: (state) => ({
        profile: state.profile,
        currentResume: state.currentResume,
        selectedTemplate: state.selectedTemplate,
      }),
    }
  )
)
