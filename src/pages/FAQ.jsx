import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import { useSEO, useJsonLd } from '../lib/seo';

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

  useSEO({
    title: 'FAQ — Kitabi AI Writer Questions Answered',
    description: 'Common questions about Kitabi: how AI book writing works, supported genres, pricing, privacy, formats, refunds, and more.',
    canonical: 'https://kitabi.ink/faq',
    image: 'https://kitabi.ink/og-image.svg',
  });

  // FAQPage JSON-LD — eligible for Google's rich-result Q&A snippets in search.
  const faqJsonLd = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: SECTIONS.flatMap((section) =>
      section.items.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      }))
    ),
  }), []);
  useJsonLd(faqJsonLd);

  return (
    <PageLayout>
      <div className="bg-kitabi-night">
        {/* HERO */}
        <section className="min-h-[50vh] flex flex-col justify-center px-6 sm:px-12 lg:px-24 py-20">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="eyebrow mb-5"
          >
            Answers
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-display text-5xl sm:text-6xl lg:text-7xl font-medium mb-7 text-kitabi-ivory leading-[1.05]"
          >
            Got <em className="foil italic">questions</em>?
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl sm:text-2xl text-kitabi-stone max-w-2xl"
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
                <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-medium text-kitabi-ivory">
                  {section.category}
                </h2>
                <div className="flex-1 h-px bg-[rgba(237,228,211,0.09)]" aria-hidden="true" />
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
                      className={`border rounded-lg px-6 py-5 cursor-pointer transition-colors bg-kitabi-night-soft
                        ${open
                          ? 'border-gilt'
                          : 'border-seam hover:border-gilt'}`}
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
                        <span className="font-medium text-base sm:text-lg text-kitabi-ivory">{item.q}</span>
                        <motion.span
                          animate={{ rotate: open ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                          className="text-kitabi-gold text-lg flex-shrink-0"
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
                            <p className="text-kitabi-stone mt-4 text-sm sm:text-base leading-relaxed">
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
            className="bg-kitabi-night-soft rounded-lg p-10 sm:p-16 border border-seam text-center"
          >
            <h3 className="font-display text-3xl sm:text-4xl font-medium mb-4 text-kitabi-ivory">
              Still have questions?
            </h3>
            <p className="text-base sm:text-lg text-kitabi-stone mb-7">
              Email us. We respond within 24 hours.
            </p>
            <a
              href="mailto:support@kitabi.app"
              className="inline-block text-kitabi-gold hover:text-kitabi-ivory font-semibold text-lg transition-colors"
            >
              support@kitabi.app →
            </a>
          </motion.div>
        </section>

        {/* CTA */}
        <section className="px-6 sm:px-12 lg:px-24 py-20 lg:py-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-medium mb-7 text-kitabi-ivory">
              Ready to start?
            </h2>
            <Link
              to="/"
              className="inline-block btn-gold px-12 py-4 rounded-md font-semibold text-base sm:text-lg"
            >
              Begin writing →
            </Link>
          </motion.div>
        </section>
      </div>
    </PageLayout>
  );
}
