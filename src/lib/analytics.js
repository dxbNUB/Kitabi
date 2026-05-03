function track(event, props = {}) {
  if (typeof window === 'undefined') return;
  window.plausible?.(event, { props });
}

export const analytics = {
  ideaSubmitted:       (genre)           => track('idea_submitted',        { genre: genre || 'unknown' }),
  guidedFlowCompleted: (genre)           => track('guided_flow_completed', { genre }),
  chapterRequested:    (genre, mode)     => track('chapter_requested',     { genre, mode }),
  chapterGenerated:    (genre, wc, secs) => track('chapter_generated',     { genre, word_count: wc, seconds: secs }),
  pdfDownloaded:       (genre)           => track('pdf_downloaded',        { genre }),
  waitlistJoined:      (genre, mode)     => track('waitlist_joined',       { genre, mode }),
  modeSwitched:        (from, to)        => track('mode_switched',         { from, to }),
  genreSelected:       (genre, method)   => track('genre_selected',        { genre, method }),
  chapterRegenerated:  (genre)           => track('chapter_regenerated',   { genre }),
  comparisonViewed:    ()                => track('comparison_viewed'),
  dropOff:             (phase, genre)    => track('drop_off',              { phase, genre: genre || 'none' }),
};

export const funnelTimer = {
  start:   () => sessionStorage.setItem('if_funnel_start', Date.now()),
  elapsed: () => {
    const start = sessionStorage.getItem('if_funnel_start');
    return start ? Math.round((Date.now() - parseInt(start)) / 1000) : null;
  },
};
