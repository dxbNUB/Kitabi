import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import { useSEO } from '../lib/seo';

const STEPS = [
  {
    number: 1,
    title: 'Tell us your book idea',
    description:
      "Not a finished outline. Not a polished concept. Just your messy, raw idea — the book you've been carrying around for months.",
    visual: 'idea',
  },
  {
    number: 2,
    title: 'Kitabi asks clarifying questions',
    description:
      'Trained on 10,000+ published books, our system asks the Socratic questions a master craftsman would. No interrogation — a real conversation.',
    visual: 'chat',
  },
  {
    number: 3,
    title: 'Kitabi writes Chapter 1',
    description:
      "Based on what you said, we write your book's opening chapter — 1,500-2,500 words of publication-quality prose. Genre-aware, character-driven.",
    visual: 'chapter',
  },
  {
    number: 4,
    title: 'Literary AI analyzes Chapter 1',
    description:
      'Your opening chapter is reviewed for pacing, dialogue, sensory specificity, and theme coherence. Scored against the patterns of bestsellers.',
    visual: 'scores',
  },
  {
    number: 5,
    title: 'Build your book, chapter by chapter',
    description:
      'Download Chapter 1 as .txt, .docx, or .pdf — or write Chapter 2, then 3, then 4, and assemble your finished book.',
    visual: 'download',
  },
];

// ─── Step preview mockups ─────────────────────────────────────────────────
function StepVisual({ kind }) {
  const wrap = 'relative w-full max-w-sm bg-white border border-gray-200 rounded-xl shadow-md p-5';
  switch (kind) {
    case 'idea':
      return (
        <div className={wrap}>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-3">Your story idea</p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 min-h-[100px]">
            <p className="text-sm text-[#1A1A1A] leading-relaxed font-serif">
              A cybersecurity worker discovers her boss has been siphoning funds from the bank. She's running from people she can't identify…
              <span className="inline-block w-[2px] h-4 bg-[#C8964D] align-middle ml-0.5 animate-pulse" />
            </p>
          </div>
          <div className="flex justify-end mt-3">
            <span className="px-4 py-1.5 bg-[#C8964D] text-white text-xs font-semibold rounded-md">Begin</span>
          </div>
        </div>
      );
    case 'chat':
      return (
        <div className={wrap}>
          <div className="space-y-2.5">
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%] text-sm font-serif text-[#1A1A1A] leading-relaxed">
                Who's the most dangerous person in this story — and why don't they seem dangerous at first?
              </div>
            </div>
            <div className="flex justify-end">
              <div className="bg-[#C8964D] text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%] text-sm">
                Her CEO. He mentored her for six years.
              </div>
            </div>
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%] text-sm font-serif text-[#1A1A1A]">
                Good. Now — what does she lose if she's right?
              </div>
            </div>
          </div>
        </div>
      );
    case 'chapter':
      return (
        <div className={wrap}>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1">Thriller · Chapter One</p>
          <h4 className="font-serif text-lg text-[#1A1A1A] mb-3">The Last Office</h4>
          <div className="space-y-1.5">
            {[100, 92, 96, 88, 100, 76, 95, 90].map((w, i) => (
              <div key={i} className="h-1.5 bg-gray-200 rounded-full" style={{ width: `${w}%` }} />
            ))}
            <div className="h-1.5" />
            {[100, 88, 95].map((w, i) => (
              <div key={i} className="h-1.5 bg-gray-200 rounded-full" style={{ width: `${w}%` }} />
            ))}
          </div>
          <p className="text-[11px] text-gray-500 mt-4">2,143 words · ~9 min read</p>
        </div>
      );
    case 'scores':
      return (
        <div className={wrap}>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-4">Quality scores</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Prose', score: 8.5, color: '#50C878' },
              { label: 'Genre', score: 8.2, color: '#50C878' },
              { label: 'Char.', score: 7.4, color: '#F5A623' },
              { label: 'Theme', score: 8.0, color: '#50C878' },
              { label: 'Tech.', score: 8.6, color: '#50C878' },
              { label: 'Overall', score: 8.1, color: '#50C878' },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1">
                <div className="relative w-10 h-10">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke={s.color} strokeWidth="3"
                            strokeDasharray={`${(s.score / 10) * 100} 100`} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color: s.color }}>
                    {s.score}
                  </span>
                </div>
                <span className="text-[10px] text-gray-500">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      );
    case 'download':
      return (
        <div className={wrap}>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-4">Save your chapter</p>
          <div className="space-y-2">
            {[
              { label: '.txt — Plain text',   featured: false },
              { label: '.docx — Word doc',    featured: true  },
              { label: '.pdf — Print-ready',  featured: false },
            ].map((f) => (
              <div
                key={f.label}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                  ${f.featured
                    ? 'bg-[#FFF7EB] border border-[#C8964D]/40 text-[#1A1A1A]'
                    : 'border border-gray-200 text-gray-600'}
                `}
              >
                <span className={f.featured ? 'text-[#C8964D]' : 'text-gray-400'} aria-hidden="true">⬇</span>
                <span>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      );
    default:
      return null;
  }
}

const PROMISES = [
  { number: '8.0+/10', label: 'Every chapter',  description: 'Minimum quality standard enforced' },
  { number: '10K',     label: 'Books trained on', description: 'Our AI learned from bestsellers' },
  { number: 'Monthly', label: 'Updates',         description: 'Latest bestseller patterns' },
];

export default function HowItWorks() {
  useSEO({
    title: 'How Kitabi Works — AI Writing Assistant for Novel Writing | Kitabi',
    description: "How Kitabi's AI writing assistant generates publication-quality book chapters. Genre-aware AI book writer that produces 1,500–2,500 words per chapter. Trained on 10,000 bestsellers.",
    canonical: 'https://kitabi.ink/how-it-works',
    image: 'https://kitabi.ink/og-image.svg',
  });

  return (
    <PageLayout>
      <div className="bg-white">
        {/* HERO */}
        <section className="min-h-[80vh] flex flex-col justify-center px-6 sm:px-12 lg:px-24 py-20 relative overflow-hidden">
          {/* Animated background blobs */}
          <div className="absolute top-20 right-20 w-96 h-96 bg-[#FFE4B8] rounded-full blur-3xl opacity-30 animate-pulse" aria-hidden="true" />
          <div className="absolute bottom-20 left-20 w-64 h-64 bg-[#FFF7EB] rounded-full blur-3xl opacity-40 animate-pulse" aria-hidden="true" />

          <div className="relative z-10">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-serif text-5xl sm:text-6xl lg:text-7xl font-medium mb-6 text-[#1A1A1A] leading-[1.05]"
            >
              How it <span className="italic text-[#C8964D]">works</span>.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-xl sm:text-2xl lg:text-3xl text-gray-600 max-w-2xl leading-relaxed"
            >
              The path from "idea" to "finished book." Five steps. Each one removes a reason people quit.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex gap-3 sm:gap-4 mt-12 sm:mt-16"
            >
              {STEPS.map((s) => (
                <motion.a
                  key={s.number}
                  href={`#step-${s.number}`}
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-gray-300
                             flex items-center justify-center font-semibold text-base sm:text-lg text-gray-600
                             hover:border-[#C8964D] hover:text-[#C8964D] hover:shadow-lg transition-all"
                >
                  {s.number}
                </motion.a>
              ))}
            </motion.div>
          </div>
        </section>

        {/* STEPS */}
        <section className="px-6 sm:px-12 lg:px-24 py-20 lg:py-32 space-y-24 lg:space-y-40">
          {STEPS.map((step, idx) => {
            const reversed = idx % 2 === 1;
            return (
              <motion.div
                key={step.number}
                id={`step-${step.number}`}
                initial={{ opacity: 0, x: reversed ? 50 : -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true, margin: '-100px' }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center"
              >
                {/* Text */}
                <div className={reversed ? 'lg:order-2' : 'lg:order-1'}>
                  <div className="inline-flex w-14 h-14 rounded-full bg-[#FFF7EB] items-center justify-center mb-6 border border-[#C8964D]/30">
                    <span className="font-display text-2xl font-medium text-[#C8964D]">
                      {step.number}
                    </span>
                  </div>

                  <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium mb-5 text-[#1A1A1A] leading-tight">
                    {step.title}
                  </h2>
                  <p className="text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed max-w-md">
                    {step.description}
                  </p>
                </div>

                {/* Visual mockup with 3D rotate on hover */}
                <div className={reversed ? 'lg:order-1' : 'lg:order-2'} style={{ perspective: '1200px' }}>
                  <motion.div
                    whileHover={{ rotateX: 4, rotateY: -4, scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                    style={{ transformStyle: 'preserve-3d' }}
                    className="rounded-3xl bg-gradient-to-br from-[#FBF7EE] via-white to-[#FFF7EB]
                               p-8 sm:p-10 shadow-md border border-gray-200
                               hover:shadow-xl transition-shadow flex items-center justify-center"
                  >
                    <StepVisual kind={step.visual} />
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </section>

        {/* QUALITY PROMISE */}
        <section className="px-6 sm:px-12 lg:px-24 py-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-[#FFF7EB] via-white to-[#FFE4B8]/40 rounded-3xl p-8 sm:p-10 lg:p-12 border-2 border-[#C8964D]/30"
          >
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium mb-10 text-center text-[#1A1A1A]">
              Our quality promise
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {PROMISES.map((item, idx) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  whileHover={{ scale: 1.04, y: -6 }}
                  transition={{ type: 'spring', stiffness: 250, damping: 20, delay: idx * 0.08 }}
                  className="min-w-0 text-center p-6 bg-white rounded-2xl shadow-md border-2 border-gray-100 hover:border-[#C8964D] transition-all"
                >
                  <div className="text-3xl sm:text-4xl font-display font-medium text-[#C8964D] mb-2 leading-none whitespace-nowrap">
                    {item.number}
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg mb-2 text-[#1A1A1A]">{item.label}</h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </motion.div>
              ))}
            </div>
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
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium mb-5 text-[#1A1A1A]">
              Ready to start your book?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 mb-10">
              Write Chapter 1 free. No signup. See how it feels.
            </p>
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
