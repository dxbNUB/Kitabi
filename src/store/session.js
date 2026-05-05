import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSession = create(
  persist(
    (set, get) => ({
      sessionId: crypto.randomUUID(),
      mode: 'nonwriter',
      genre: null,
      phase: 'landing',

      project: {
        title:   null,
        premise: null,
        logline: null,
      },

      characters:     [],
      plotPoints:     [],
      userStyleNotes: [],
      adviceGiven:    [],
      messageHistory: [],
      generationsUsed: 0,
      chapterGenerated: null,     // raw markdown from Claude
      chapterEditedHtml: null,    // user's edits (rich HTML from TipTap)

      // Persistence: row IDs of the chat/chapter rows currently being
      // mirrored to Supabase. Set by Chat.jsx on first message + first
      // generation, cleared on reset(). Survives navigation via the
      // sessionStorage Zustand persist below.
      currentChatId: null,
      currentChapterId: null,

      setMode:  (mode)  => set({ mode }),
      setGenre: (genre) => set({ genre }),
      setPhase: (phase) => set({ phase }),

      updateProject: (fields) =>
        set((s) => ({ project: { ...s.project, ...fields } })),

      addCharacter: (char) =>
        set((s) => ({ characters: [...s.characters, char] })),

      addPlotPoint: (point) =>
        set((s) => ({ plotPoints: [...s.plotPoints, point] })),

      addAdvice: (summary) =>
        set((s) => ({ adviceGiven: [...s.adviceGiven.slice(-20), summary] })),

      addMessage: (message) =>
        set((s) => ({ messageHistory: [...s.messageHistory, message] })),

      setChapterGenerated: (text) =>
        set({ chapterGenerated: text, chapterEditedHtml: null, phase: 'chapter' }),

      setCurrentChatId:    (id) => set({ currentChatId:    id }),
      setCurrentChapterId: (id) => set({ currentChapterId: id }),

      setChapterEditedHtml: (html) =>
        set({ chapterEditedHtml: html }),

      incrementGenerations: () =>
        set((s) => ({ generationsUsed: s.generationsUsed + 1 })),

      canGenerate: () => {
        if (import.meta.env.VITE_KITABI_UNLIMITED === 'true') return true;
        return get().generationsUsed < 1;
      },

      getContextSummary: () => {
        const s = get();
        return {
          genre:          s.genre,
          mode:           s.mode,
          project:        s.project,
          characters:     s.characters,
          plotPoints:     s.plotPoints,
          adviceGiven:    s.adviceGiven.slice(-10),
          userStyleNotes: s.userStyleNotes,
        };
      },

      reset: () => set({
        sessionId: crypto.randomUUID(),
        mode: 'nonwriter', genre: null, phase: 'landing',
        project: { title: null, premise: null, logline: null },
        characters: [], plotPoints: [], userStyleNotes: [],
        adviceGiven: [], messageHistory: [],
        generationsUsed: 0, chapterGenerated: null, chapterEditedHtml: null,
        currentChatId: null, currentChapterId: null,
      }),
    }),
    {
      name: 'kitabi-session',
      storage: {
        getItem:    (k) => sessionStorage.getItem(k),
        setItem:    (k, v) => sessionStorage.setItem(k, v),
        removeItem: (k) => sessionStorage.removeItem(k),
      },
    }
  )
);
