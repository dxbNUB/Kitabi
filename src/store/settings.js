import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * User-level settings — language preference, book type.
 * Persisted to localStorage so they survive page reload AND "New Story" resets
 * (the session store is wiped on reset; settings are not).
 *
 * TODO(firebase): when auth lands, mirror these to users/{uid}.settings on
 * sign-in and on every change. Read on app boot to seed this store.
 */
export const useSettings = create(
  persist(
    (set) => ({
      language: 'american',     // 'american' | 'british'
      bookType: 'novel',        // 'short-story' | 'novella' | 'novel'

      setLanguage: (language) => set({ language }),
      setBookType: (bookType) => set({ bookType }),
      reset:       ()         => set({ language: 'american', bookType: 'novel' }),
    }),
    {
      name: 'kitabi-settings',
      // Use localStorage (not sessionStorage like the session store) — settings
      // should persist across browser sessions, not just within one tab.
      storage: {
        getItem:    (k) => {
          const v = localStorage.getItem(k);
          return v ? JSON.parse(v) : null;
        },
        setItem:    (k, v) => localStorage.setItem(k, JSON.stringify(v)),
        removeItem: (k)    => localStorage.removeItem(k),
      },
    }
  )
);

// Reference data exported so Settings page + AI prompts share the same source of truth.
export const BOOK_TYPES = {
  'short-story': {
    label:        'Short Story',
    wordCount:    '5,000–10,000 words',
    chapterRange: '3-5 chapters',
    chapterTarget: 4,
    wordTarget:   1500,
    pacing:       'Fast pacing. Each chapter advances plot significantly.',
    structure:    'Compressed three-act structure across 3-5 chapters.',
    style:        'Punchy, focused. Every scene must matter.',
    blurb:        'Quick, focused narrative with one main conflict.',
  },
  novella: {
    label:        'Novella',
    wordCount:    '20,000–40,000 words',
    chapterRange: '10-15 chapters',
    chapterTarget: 12,
    wordTarget:   2500,
    pacing:       'Medium pacing. Room for character development but stay focused.',
    structure:    'Three-act structure with clear midpoint.',
    style:        'Atmospheric. One main plotline with one subplot allowed.',
    blurb:        'Mid-length story with one subplot.',
  },
  novel: {
    label:        'Novel',
    wordCount:    '60,000–100,000 words',
    chapterRange: '25-40 chapters',
    chapterTarget: 30,
    wordTarget:   2500,
    pacing:       'Patient pacing. Multiple subplots can develop.',
    structure:    'Full novel structure with multiple turning points.',
    style:        'Rich character development. Multiple POVs allowed.',
    blurb:        'Full-length book with multiple storylines.',
  },
};

export const LANGUAGES = {
  american: {
    label:    'American English',
    examples: '"color", "realize", "favorite", "center"',
    regions:  'USA, Canada, Philippines',
  },
  british: {
    label:    'British English',
    examples: '"colour", "realise", "favourite", "centre"',
    regions:  'UK, Australia, India, UAE',
  },
};
