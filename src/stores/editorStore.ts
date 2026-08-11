import { create } from 'zustand'

interface EditorState {
  title: string
  content: string
  slug: string
  excerpt: string
  category: string
  tags: string[]
  featuredImage: string
  status: 'draft' | 'published' | 'scheduled'
  metaTitle: string
  metaDescription: string
  dirty: boolean
  saving: boolean
  lastSaved: Date | null
  setField: (field: string, value: unknown) => void
  setDirty: (dirty: boolean) => void
  setSaving: (saving: boolean) => void
  setLastSaved: () => void
  reset: () => void
}

export const useEditorStore = create<EditorState>((set) => ({
  title: '',
  content: '',
  slug: '',
  excerpt: '',
  category: '',
  tags: [],
  featuredImage: '',
  status: 'draft',
  metaTitle: '',
  metaDescription: '',
  dirty: false,
  saving: false,
  lastSaved: null,
  setField: (field, value) => set((state) => ({ ...state, [field]: value, dirty: true })),
  setDirty: (dirty) => set({ dirty }),
  setSaving: (saving) => set({ saving }),
  setLastSaved: () => set({ lastSaved: new Date(), dirty: false, saving: false }),
  reset: () => set({
    title: '', content: '', slug: '', excerpt: '', category: '',
    tags: [], featuredImage: '', status: 'draft',
    metaTitle: '', metaDescription: '',
    dirty: false, saving: false, lastSaved: null,
  }),
}))
