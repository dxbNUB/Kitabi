import { motion } from 'framer-motion';
import PageLayout from './PageLayout';

/**
 * LegalLayout — shared wrapper for legal pages (Terms, Privacy, AUP, etc).
 * Consistent header, eyebrow, last-updated date, and prose styling so all four
 * legal pages read like the same document.
 */
export default function LegalLayout({ eyebrow, title, intro, lastUpdated, children }) {
  return (
    <PageLayout>
      <div className="bg-white">
        {/* Hero */}
        <section className="px-6 sm:px-12 lg:px-24 pt-16 lg:pt-24 pb-10 border-b border-gray-200">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="text-[11px] uppercase tracking-[0.2em] text-gray-500 mb-3"
          >
            {eyebrow}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium mb-5 text-[#1A1A1A] leading-[1.05]"
          >
            {title}
          </motion.h1>
          {intro && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-base sm:text-lg text-gray-600 max-w-2xl"
            >
              {intro}
            </motion.p>
          )}
          {lastUpdated && (
            <p className="text-xs text-gray-500 mt-6">
              Last updated: <span className="text-[#1A1A1A]">{lastUpdated}</span>
            </p>
          )}
        </section>

        {/* Body */}
        <article className="px-6 sm:px-12 lg:px-24 py-12 max-w-3xl legal-prose">
          {children}
        </article>
      </div>
    </PageLayout>
  );
}
