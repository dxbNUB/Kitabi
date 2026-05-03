import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageLayout from '../components/PageLayout';
import { useSettings, BOOK_TYPES, LANGUAGES } from '../store/settings';

export default function Settings() {
  const language    = useSettings((s) => s.language);
  const bookType    = useSettings((s) => s.bookType);
  const setLanguage = useSettings((s) => s.setLanguage);
  const setBookType = useSettings((s) => s.setBookType);

  // Saving with the persist middleware is automatic, but we surface a toast
  // so the user knows something happened.
  const [savedFlag, setSavedFlag] = useState(0);
  const flashSaved = () => setSavedFlag((n) => n + 1);

  const handleLanguage = (v) => { setLanguage(v); flashSaved(); };
  const handleBookType = (v) => { setBookType(v); flashSaved(); };

  return (
    <PageLayout>
      <div className="bg-white">
        {/* Hero */}
        <section className="px-6 sm:px-12 lg:px-24 pt-16 lg:pt-24 pb-10 border-b border-gray-200">
          <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500 mb-3">Settings</p>
          <h1 className="font-serif text-4xl sm:text-5xl font-medium text-[#1A1A1A] leading-[1.05] mb-4">
            Make Kitabi yours.
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-xl">
            These preferences shape every chapter we write for you. Changes save automatically.
          </p>
        </section>

        {/* LANGUAGE */}
        <section className="px-6 sm:px-12 lg:px-24 pt-12 pb-8">
          <h2 className="font-serif text-2xl sm:text-3xl text-[#1A1A1A] mb-2">Language</h2>
          <p className="text-gray-600 mb-7 max-w-xl">
            Choose how Kitabi spells words and uses grammar. Affects every generated chapter.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
            {Object.entries(LANGUAGES).map(([key, info]) => {
              const active = language === key;
              return (
                <motion.button
                  key={key}
                  onClick={() => handleLanguage(key)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  aria-pressed={active}
                  className={`p-5 sm:p-6 border-2 rounded-xl text-left transition-shadow
                    ${active
                      ? 'border-[#C8964D] bg-[#FFF7EB] shadow-md'
                      : 'border-gray-200 hover:border-[#C8964D] hover:shadow-md'}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-serif text-lg font-semibold text-[#1A1A1A]">
                      {info.label}
                    </span>
                    {active && (
                      <span className="text-[10px] uppercase tracking-[0.18em] text-[#C8964D] font-semibold">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="font-serif text-sm text-gray-700 mb-1.5">{info.examples}</p>
                  <p className="text-xs text-gray-500">Used in: {info.regions}</p>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* BOOK TYPE */}
        <section className="px-6 sm:px-12 lg:px-24 pt-8 pb-12">
          <h2 className="font-serif text-2xl sm:text-3xl text-[#1A1A1A] mb-2">Book type</h2>
          <p className="text-gray-600 mb-7 max-w-xl">
            What kind of book are you writing? This affects pacing, structure, and chapter length.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl">
            {Object.entries(BOOK_TYPES).map(([key, info]) => {
              const active = bookType === key;
              return (
                <motion.button
                  key={key}
                  onClick={() => handleBookType(key)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  aria-pressed={active}
                  className={`p-5 sm:p-6 border-2 rounded-xl text-left transition-shadow
                    ${active
                      ? 'border-[#C8964D] bg-[#FFF7EB] shadow-md'
                      : 'border-gray-200 hover:border-[#C8964D] hover:shadow-md'}`}
                >
                  <div className="flex items-baseline justify-between gap-2 mb-2">
                    <span className="font-serif text-lg font-semibold text-[#1A1A1A]">
                      {info.label}
                    </span>
                    {active && (
                      <span className="text-[10px] uppercase tracking-[0.18em] text-[#C8964D] font-semibold">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#C8964D] font-semibold mb-1">{info.wordCount}</p>
                  <p className="text-xs text-gray-500 mb-2.5">{info.chapterRange}</p>
                  <p className="text-sm text-gray-700 leading-snug">{info.blurb}</p>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* Auto-save toast */}
        <AnimatePresence>
          {savedFlag > 0 && (
            <motion.div
              key={savedFlag}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.25 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50
                         bg-emerald-50 border border-emerald-200 text-emerald-800
                         px-4 py-2 rounded-lg shadow-md text-sm font-medium flex items-center gap-2"
              role="status"
              aria-live="polite"
            >
              <span aria-hidden="true">✓</span> Saved
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageLayout>
  );
}
