import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import PageLayout from '../components/PageLayout';

const SECTIONS = [
  {
    category: 'Product',
    items: [
      { q: "Why do most people never finish their book?",
        a: "Three reasons: blank-page paralysis, no structure to follow, and no momentum. Most aspiring authors quit between Chapter 2 and Chapter 5 — the slog where the initial excitement fades and the structure isn't clear yet. Kitabi removes all three: we write Chapter 1 with you, the genre rules give you structure, and the dashboard shows your streak so quitting feels expensive." },
      { q: 'Do I need to be a writer?',          a: 'No. Kitabi is built for people who have a book inside them but were never going to actually write it. You answer 5 questions in plain language and we write Chapter 1 from your answers. From there, you keep going chapter by chapter.' },
      { q: 'How do I actually finish a book?',   a: 'Start with Chapter 1. Then generate Chapter 2, 3, 4. Combine them in My Books. The dashboard tracks your streak and milestones so the work compounds. Most people who write 5 chapters in a row finish the book — the hard part is making it past the first week.' },
      { q: 'Is one chapter enough?',             a: "One chapter proves your idea works. Finishing a book takes 10-30 more. Kitabi makes that path obvious — you don't have to figure out structure, pacing, or what comes next. You direct the story, we handle the prose, the dashboard keeps you honest." },
      { q: 'How long does it take?',             a: 'Chapter generation runs 90-120 seconds. The full conversation, from your first idea to a finished Chapter 1, usually takes under 10 minutes. A full book of 20 chapters is roughly an evening of work, spread out.' },
      { q: 'Can I edit the chapter?',            a: 'Yes. Full editor with AI coach. Rewrite, expand, condense as much as you want. Or download to .docx and edit in Word/Google Docs.' },
      { q: 'How is this different from ChatGPT?',a: 'We specialise in book writing. Trained on 10K bestsellers, analyse every chapter against genre patterns, and ship in standard manuscript formats.' },
    ],
  },
  {
    category: 'Quality',
    items: [
      { q: 'Will it sound AI-generated?',        a: "No. Our 8.0+/10 quality bar means it passes the 'would this be published' test before you ever see it." },
      { q: 'What genres do you support?',        a: 'Fiction: Thriller, Fantasy, Sci-Fi, Historical, plus general literary fiction. Non-Fiction: Business, Self-help, Memoir-style narrative.' },
      { q: 'Is the 8.7/10 analysis score real?', a: 'Yes. We tested on professional chapters in blind comparison with human editorial notes. Independent reviewers scored our feedback at 8.7/10.' },
    ],
  },
  {
    category: 'Account',
    items: [
      { q: 'Do I need an account?',              a: 'Not for the free tier. Sign in with Google when you want to save chapters to your library across devices.' },
      { q: 'Can I cancel anytime?',              a: 'Yes. No penalties. Cancel from settings anytime.' },
      { q: 'What happens to my chapters?',       a: 'They stay forever. Download anytime, in any supported format, even after canceling.' },
      { q: 'Do you offer refunds?',              a: '30-day money-back guarantee. Email support and you get a full refund — no justification needed.' },
    ],
  },
  {
    category: 'Privacy',
    items: [
      { q: 'Is my writing private?',             a: "Yes. Private by default. We don't surface or share your writing without your permission." },
      { q: 'Do you train AI on my work?',        a: "No. Your chapters aren't used as training data. Only aggregated, anonymized telemetry is used to improve quality." },
      { q: 'Do you sell my data?',               a: 'Never. We use email only for account communication and (if you opt in) product updates.' },
    ],
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <PageLayout>
      <div className="bg-white">
        {/* HERO */}
        <section className="min-h-[60vh] flex flex-col justify-center px-6 sm:px-12 lg:px-24 py-20">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-serif text-5xl sm:text-6xl lg:text-7xl font-medium mb-7 text-[#1A1A1A] leading-[1.05]"
          >
            Got <span className="italic text-[#C8964D]">questions</span>?
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl sm:text-2xl lg:text-3xl text-gray-600 max-w-2xl"
          >
            We've answered them all. And if you don't see yours, just ask.
          </motion.p>
        </section>

        {/* FAQ SECTIONS */}
        <section className="px-6 sm:px-12 lg:px-24 py-16 max-w-4xl">
          {SECTIONS.map((section, sIdx) => (
            <motion.div
              key={section.category}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: sIdx * 0.08 }}
              viewport={{ once: true }}
              className="mb-16 lg:mb-24"
            >
              <div className="flex items-center gap-4 mb-8">
                <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-medium text-[#1A1A1A]">
                  {section.category}
                </h2>
                <div className="flex-1 h-px bg-gray-200" aria-hidden="true" />
              </div>

              <div className="space-y-4">
                {section.items.map((item, idx) => {
                  const key  = `${sIdx}-${idx}`;
                  const open = openIndex === key;
                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      viewport={{ once: true }}
                      className={`border-2 rounded-xl px-6 py-5 cursor-pointer transition-all
                        ${open
                          ? 'border-[#C8964D] bg-[#FFF7EB] shadow-md'
                          : 'border-gray-200 hover:border-[#C8964D] hover:bg-[#FFF7EB]'}`}
                      onClick={() => setOpenIndex(open ? null : key)}
                      role="button"
                      tabIndex={0}
                      aria-expanded={open}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setOpenIndex(open ? null : key);
                        }
                      }}
                    >
                      <div className="flex justify-between items-center gap-4 select-none">
                        <span className="font-bold text-base sm:text-lg text-[#1A1A1A]">{item.q}</span>
                        <motion.span
                          animate={{ rotate: open ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                          className="text-[#C8964D] text-xl flex-shrink-0"
                          aria-hidden="true"
                        >
                          ↓
                        </motion.span>
                      </div>
                      <AnimatePresence initial={false}>
                        {open && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <p className="text-gray-700 mt-4 text-sm sm:text-base leading-relaxed">
                              {item.a}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </section>

        {/* SUPPORT */}
        <section className="px-6 sm:px-12 lg:px-24 py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-[#FFF7EB] via-white to-[#FFE4B8]/40 rounded-3xl p-10 sm:p-16 border-2 border-[#C8964D]/30 text-center"
          >
            <h3 className="font-serif text-3xl sm:text-4xl font-medium mb-4 text-[#1A1A1A]">
              Still have questions?
            </h3>
            <p className="text-base sm:text-lg text-gray-600 mb-7">
              Email us. We respond within 24 hours.
            </p>
            <motion.a
              href="mailto:support@kitabi.app"
              whileHover={{ scale: 1.05 }}
              className="inline-block text-[#C8964D] hover:text-[#b88340] font-bold text-lg sm:text-xl"
            >
              support@kitabi.app →
            </motion.a>
          </motion.div>
        </section>

        {/* CTA */}
        <section className="px-6 sm:px-12 lg:px-24 py-20 lg:py-32 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium mb-7 text-[#1A1A1A]">
              Ready to start?
            </h2>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
              <Link
                to="/"
                className="inline-block bg-[#C8964D] text-white px-12 sm:px-16 py-4 sm:py-5
                           rounded-xl font-bold text-base sm:text-xl hover:bg-[#b88340]
                           hover:shadow-2xl transition-all"
              >
                Begin Writing →
              </Link>
            </motion.div>
          </motion.div>
        </section>
      </div>
    </PageLayout>
  );
}
