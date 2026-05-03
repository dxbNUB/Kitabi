/**
 * Personalization — converts onboarding answers into a tailored experience profile.
 * Pure logic, no React, no Firebase. Output is consumed by Welcome page,
 * the Chat AI prompt selector, and pricing recommendations.
 */

export function getPersonalizedExperience(answers) {
  if (!answers || Object.keys(answers).length === 0) {
    return getDefaultExperience();
  }

  const profile = {
    skill:         answers[1],
    bookType:      answers[2],
    timeAvailable: answers[3],
    challenge:     answers[4],
    goal:          answers[5],
  };

  return {
    profile,
    aiMode:            getAiMode(profile),
    sessionMode:       getSessionMode(profile),       // maps to existing 'writer' | 'nonwriter'
    chapterTarget:     getChapterTarget(profile.timeAvailable),
    recommendedTier:   getRecommendedTier(profile.goal),
    welcomeMessage:    getWelcomeMessage(profile),
    suggestedGenres:   getSuggestedGenres(profile.bookType),
    priorityFeatures:  getPriorityFeatures(profile.challenge),
    estimatedTimeline: getEstimatedTimeline(profile),
  };
}

// ─── Mode mapping ────────────────────────────────────────────────────
// Internal AI mode (richer) vs the existing two-state writer/nonwriter.

function getAiMode(profile) {
  if (profile.skill === 'never' || profile.skill === 'started') return 'encouraging';
  if (profile.skill === 'published')                            return 'advanced';
  return 'standard';
}

function getSessionMode(profile) {
  // The Zustand session has only writer | nonwriter — collapse the 3 AI modes onto it.
  return profile.skill === 'published' ? 'writer' : 'nonwriter';
}

// ─── Targets & tiers ──────────────────────────────────────────────────

function getChapterTarget(timeAvailable) {
  return ({ casual: 2, regular: 4, serious: 8, intense: 15 })[timeAvailable] || 4;
}

function getRecommendedTier(goal) {
  if (goal === 'personal' || goal === 'share') return 'starter';
  return 'author';
}

function getEstimatedTimeline(profile) {
  return ({
    casual:  { weeks: 16, description: 'Full book in ~4 months'   },
    regular: { weeks: 10, description: 'Full book in ~2.5 months' },
    serious: { weeks: 6,  description: 'Full book in ~6 weeks'    },
    intense: { weeks: 4,  description: 'Full book in ~1 month'    },
  })[profile.timeAvailable] || { weeks: 10, description: 'Full book in ~2.5 months' };
}

// ─── Copy ─────────────────────────────────────────────────────────────

function getWelcomeMessage(profile) {
  return ({
    never:     "Welcome. Don't worry about being perfect — let's just get Chapter 1 written.",
    started:   'Welcome back to writing. This time, you finish.',
    some:      "Welcome. Let's level up your writing with the right tools.",
    published: "Welcome. We've loaded our most advanced features for you.",
  })[profile.skill] || 'Welcome to Kitabi.';
}

function getSuggestedGenres(bookType) {
  return ({
    fiction:  ['thriller', 'fantasy', 'scifi', 'historical'],
    memoir:   ['historical', 'business'],
    business: ['business'],
    academic: ['business', 'historical'],
    unsure:   ['thriller', 'fantasy', 'scifi', 'business', 'historical'],
  })[bookType] || ['thriller', 'fantasy', 'scifi', 'business', 'historical'];
}

function getPriorityFeatures(challenge) {
  return ({
    ideas: [
      { id: 'ai-chat',        name: 'Idea Conversation',  description: 'Kitabi helps you flesh out raw ideas through Socratic questions' },
      { id: 'genre-prompts',  name: 'Genre Templates',    description: 'Get started with proven structures from 10K bestsellers' },
    ],
    writing: [
      { id: 'ai-rewrite',     name: 'Rewrite',            description: 'Regenerate any chapter with one click' },
      { id: 'tone-adjust',    name: 'Tone Adjustment',    description: 'Push the chapter darker, lighter, faster, or slower' },
    ],
    structure: [
      { id: 'analyze-text',   name: 'Literary Analysis',  description: 'See exactly where pacing, character, or theme break down' },
      { id: 'genre-rules',    name: 'Genre-Aware Craft',  description: 'Each genre has its own structural rules built in' },
    ],
    consistency: [
      { id: 'my-books',       name: 'My Books Library',   description: 'Save chapters and pick up where you left off' },
      { id: 'short-loops',    name: 'Short Loops',        description: 'Each chapter takes ~10 minutes — momentum compounds' },
    ],
    quality: [
      { id: 'analyze-text',   name: 'Analyze Text',       description: 'Expert-level craft feedback at 8.7/10 quality' },
      { id: 'rewrite-cycle',  name: 'Rewrite Cycle',      description: 'Polish your prose to publication-ready quality' },
    ],
  })[challenge] || [];
}

// ─── Defaults ─────────────────────────────────────────────────────────

function getDefaultExperience() {
  return {
    profile: null,
    aiMode: 'standard',
    sessionMode: 'nonwriter',
    chapterTarget: 4,
    recommendedTier: 'author',
    welcomeMessage: "Welcome to Kitabi. Let's write your book.",
    suggestedGenres: ['thriller', 'fantasy', 'scifi', 'business', 'historical'],
    priorityFeatures: [],
    estimatedTimeline: { weeks: 10, description: 'Full book in ~2.5 months' },
  };
}

// ─── Storage helpers ──────────────────────────────────────────────────

const STORAGE_KEY = 'kitabi_onboarding';

export function saveOnboardingAnswers(answers) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, completedAt: Date.now() }));
  } catch {/* ignore quota errors */}
}

export function loadOnboardingAnswers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.answers || null;
  } catch {
    return null;
  }
}

export function hasCompletedOnboarding() {
  return loadOnboardingAnswers() !== null;
}

export function clearOnboarding() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {/* ignore */}
}

// TODO(firebase): when auth lands, write `answers` and the derived experience
// to Firestore at users/{uid}/onboarding, then call clearOnboarding() so the
// localStorage copy doesn't go stale.
