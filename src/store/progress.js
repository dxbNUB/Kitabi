import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Progress tracking — chapters written, days written, streaks, milestones.
 *
 * Today: localStorage-only (per browser/device). When auth lands, mirror to
 * Firestore on every change so a user's progress follows them across devices.
 *
 * Streak rule: a user's streak counts consecutive *calendar days* on which
 * they completed at least one chapter generation.
 */

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function dayDiff(aKey, bKey) {
  const a = new Date(aKey + 'T00:00:00');
  const b = new Date(bKey + 'T00:00:00');
  return Math.round((a - b) / 86_400_000);
}

// Milestones — chapters-written thresholds and the messages they unlock.
export const MILESTONES = [
  { id: 'first',   chapters: 1,  title: 'Chapter One', message: "Your first chapter is done. The hardest one. The blank page is dead." },
  { id: 'five',    chapters: 5,  title: '5 Chapters',  message: "Five chapters in. You're not someone who *might* write a book — you're someone who's writing one." },
  { id: 'ten',     chapters: 10, title: '10 Chapters', message: "Double digits. Most people quit by now. You didn't." },
  { id: 'twenty',  chapters: 20, title: '20 Chapters', message: "A short novel's worth of pages. Whatever you started this for — keep going." },
  { id: 'fifty',   chapters: 50, title: '50 Chapters', message: "Most published novelists have written fewer chapters than you. Take that in." },
];

const initial = {
  chaptersWritten: 0,
  totalWords:      0,
  booksStarted:    0,        // tracked via setBookStarted (called when premise is set)
  daysWritten:     [],       // ['YYYY-MM-DD', ...] — unique calendar days
  currentStreak:   0,
  longestStreak:   0,
  lastWriteDate:   null,     // 'YYYY-MM-DD' | null
  milestonesEarned: [],      // [{ id, chapters, achievedAt }, ...]
};

export const useProgress = create(
  persist(
    (set, get) => ({
      ...initial,

      /**
       * Record a completed chapter generation.
       * Returns any newly-earned milestone (or null) so the caller can celebrate.
       */
      recordChapter: (wordCount = 0) => {
        const today = todayKey();
        const s = get();

        // Streak math
        let { currentStreak, longestStreak, lastWriteDate, daysWritten } = s;
        if (lastWriteDate === today) {
          // already wrote today, no streak change
        } else {
          const diff = lastWriteDate ? dayDiff(today, lastWriteDate) : null;
          currentStreak = diff === 1 ? currentStreak + 1 : 1;
          if (currentStreak > longestStreak) longestStreak = currentStreak;
          if (!daysWritten.includes(today)) daysWritten = [...daysWritten, today];
          lastWriteDate = today;
        }

        const chaptersWritten = s.chaptersWritten + 1;
        const totalWords = s.totalWords + (wordCount || 0);

        // Milestones — find any threshold we just crossed
        const earned = [...s.milestonesEarned];
        let newMilestone = null;
        for (const m of MILESTONES) {
          const already = earned.some((e) => e.id === m.id);
          if (!already && chaptersWritten >= m.chapters) {
            const entry = { id: m.id, chapters: m.chapters, achievedAt: today };
            earned.push(entry);
            newMilestone = m;     // keep just the latest one for the caller
          }
        }

        set({
          chaptersWritten, totalWords,
          currentStreak, longestStreak,
          daysWritten, lastWriteDate,
          milestonesEarned: earned,
        });

        return newMilestone;
      },

      /** Called when a user submits their first idea / starts a new book project. */
      bookStarted: () => set((s) => ({ booksStarted: s.booksStarted + 1 })),

      /** Reset only on explicit "wipe my data" — not on "new book" within an account. */
      resetAll: () => set({ ...initial }),
    }),
    {
      name: 'kitabi-progress',
      storage: {
        getItem:    (k) => { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; },
        setItem:    (k, v) => localStorage.setItem(k, JSON.stringify(v)),
        removeItem: (k) => localStorage.removeItem(k),
      },
    }
  )
);

// ─── Motivational messages (rotated by day) ────────────────────────────
const MOTIVATIONS = [
  "Most people die with their book inside them. Not you.",
  "The hardest part is starting. You already started.",
  "A page a day is a book a year.",
  "Your book has been waiting. Today is fine.",
  "Writers don't write because they have time. They write because they decided to.",
  "You don't have to write well today. You just have to write.",
  "Every finished book started as a messy first chapter.",
  "97% of writers never finish. You're not 97%.",
  "The book inside you is already real. Just put it on paper.",
  "One chapter today. That's the whole job.",
];

export function todaysMotivation() {
  // Deterministic by date so the message is stable for a given calendar day
  const k = todayKey();
  let h = 0;
  for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) | 0;
  return MOTIVATIONS[Math.abs(h) % MOTIVATIONS.length];
}
