/**
 * Builds prompt fragments from user preferences (language + bookType).
 * Imported by /api/generate.js and injected into the system prompt.
 */

export function languageInstructions(language) {
  if (language === 'british') {
    return `LANGUAGE: Use BRITISH ENGLISH throughout this chapter.

SPELLING:
- "colour" not "color", "favourite" not "favorite", "honour" not "honor"
- "realise" not "realize", "organise" not "organize", "recognise" not "recognize"
- "centre" not "center", "theatre" not "theater", "metre" not "meter", "fibre" not "fiber"
- "travelling" not "traveling", "labelled" not "labeled"
- "judgement" not "judgment", "behaviour" not "behavior", "neighbour" not "neighbor"
- "defence" not "defense", "offence" not "offense"
- "grey" not "gray", "aluminium" not "aluminum"
- "licence" (noun) / "license" (verb); "practice" (noun) / "practise" (verb)

PUNCTUATION & GRAMMAR:
- Single quotes for primary speech: 'Hello,' she said.
- Double quotes for nested: 'He said "stop".'
- Punctuation outside quotation marks unless part of the original quotation.
- Collective nouns take plural verbs: "the team are playing".

VOCABULARY (when prose calls for it):
- lift / lorry / petrol / flat / biscuit / chips / pavement / rubbish / boot / queue
- holiday (not vacation) / mobile (not cell phone) / post (not mail) / autumn (not fall)`;
  }

  return `LANGUAGE: Use AMERICAN ENGLISH throughout this chapter.

SPELLING:
- "color", "favorite", "honor", "realize", "organize", "recognize"
- "center", "theater", "meter", "fiber", "traveling", "labeled"
- "judgment", "behavior", "neighbor", "defense", "offense", "gray", "aluminum"

PUNCTUATION & GRAMMAR:
- Double quotes for primary speech: "Hello," she said.
- Single quotes for nested: "He said 'stop.'"
- Punctuation inside quotation marks (American convention).
- Collective nouns take singular verbs: "the team is playing".

VOCABULARY (when prose calls for it):
- elevator / truck / gasoline / apartment / cookie / fries / sidewalk / trash / trunk / line
- vacation / cell phone / mail / fall (not autumn)`;
}

const BOOK_TYPE_CONFIG = {
  'short-story': {
    label:        'Short Story',
    totalChapters: 4,
    pacing:       'Fast pacing. Each chapter advances plot significantly. No filler.',
    structure:    'Compressed three-act structure across 3-5 chapters.',
    style:        'Punchy, focused. Every scene must matter to the central conflict.',
    wordTarget:   1500,
  },
  novella: {
    label:        'Novella',
    totalChapters: 12,
    pacing:       'Medium pacing. Room for character development without sprawling.',
    structure:    'Three-act structure with a clear midpoint reversal.',
    style:        'Atmospheric. One main plotline; a single subplot is allowed.',
    wordTarget:   2500,
  },
  novel: {
    label:        'Novel',
    totalChapters: 30,
    pacing:       'Patient pacing. Multiple subplots can develop over time.',
    structure:    'Full novel structure with multiple turning points.',
    style:        'Rich character development. Multiple POVs allowed if the story calls for them.',
    wordTarget:   2500,
  },
};

export function bookTypeInstructions(bookType, chapterNumber = 1) {
  const cfg = BOOK_TYPE_CONFIG[bookType] || BOOK_TYPE_CONFIG.novel;
  const percent = Math.min(100, (chapterNumber / cfg.totalChapters) * 100);

  let actContext;
  if (percent < 25)      actContext = 'Act 1 (setup) — establish character, world, and the inciting incident.';
  else if (percent < 50) actContext = 'Act 2A (rising action) — develop conflicts and complications.';
  else if (percent < 75) actContext = 'Act 2B (midpoint to climax) — raise stakes, deepen tensions.';
  else if (percent < 90) actContext = 'Act 3 (climax) — bring storylines toward resolution.';
  else                   actContext = 'Resolution — wrap up with emotional payoff.';

  return `BOOK TYPE: ${cfg.label}
Expected total chapters: ${cfg.totalChapters}
This is Chapter ${chapterNumber} of ${cfg.totalChapters} (${actContext})

PACING: ${cfg.pacing}
STRUCTURE: ${cfg.structure}
STYLE: ${cfg.style}
TARGET LENGTH for this chapter: approximately ${cfg.wordTarget} words.`;
}

export function getBookTypeWordTarget(bookType) {
  return (BOOK_TYPE_CONFIG[bookType] || BOOK_TYPE_CONFIG.novel).wordTarget;
}
