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

// ─── Step preview mockups — paper objects on the dark desk ────────────────
function StepVisual({ kind }) {
  const wrap = 'relative w-full max-w-sm sheet p-5';
  switch (kind) {
    case 'idea':
      return (
        <div className={wrap}>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#9C917D] mb-3">Your story idea</p>
          <div className="border border-[rgba(44,36,22,0.12)] rounded-md p-3 min-h-[100px]">
            <p className="text-sm text-[#2C2416] leading-relaxed font-serif">
              A cybersecurity worker discovers her boss has been siphoning funds from the bank. She's running from people she can't identify…
              <span className="inline-block w-[2px] h-4 bg-kitabi-gold-deep align-middle ml-0.5 animate-pulse" />
            </p>
          </div>
          <div className="flex justify-end mt-3">
            <span className="px-4 py-1.5 bg-kitabi-gold-deep text-kitabi-paper text-xs font-semibold rounded-md">Begin</span>
          </div>
        </div>
      );
    case 'chat':
      return (
        <div className={wrap}>
          <div className="space-y-2.5">
            <div className="flex justify-start">
              <div className="border border-[rgba(44,36,22,0.15)] rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%] text-sm font-serif text-[#2C2416] leading-relaxed">
                Who's the most dangerous person in this story — and why don't they seem dangerous at first?
              </div>
            </div>
            <div className="flex justify-end">
              <div className="bg-kitabi-gold-deep text-kitabi-paper rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%] text-sm">
                Her CEO. He mentored her for six years.
              </div>
            </div>
            <div className="flex justify-start">
              <div className="border border-[rgba(44,36,22,0.15)] rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%] text-sm font-serif text-[#2C2416]">
                Good. Now — what does she lose if she's right?
              </div>
            </div>
          </div>
        </div>
      );
    case 'chapter':
      return (
        <div className={wrap}>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#9C917D] mb-1">Thriller · Chapter One</p>
          <h4 className="font-serif text-lg text-[#2C2416] mb-3">The Last Office</h4>
          <div className="space-y-1.5">
            {[100, 92, 96, 88, 100, 76, 95, 90].map((w, i) => (
              <div key={i} className="h-1.5 bg-[rgba(44,36,22,0.1)] rounded-full" style={{ width: `${w}%` }} />
            ))}
            <div className="h-1.5" />
            {[100, 88, 95].map((w, i) => (
              <div key={i} className="h-1.5 bg-[rgba(44,36,22,0.1)] rounded-full" style={{ width: `${w}%` }} />
            ))}
          </div>
          <p className="text-[11px] text-[#8A7F6A] mt-4">2,143 words · ~9 min read</p>
        </div>
      );
    case 'scores':
      return (
        <div className={wrap}>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#9C917D] mb-4">Quality scores</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Prose', score: 8.5 },
              { label: 'Genre', score: 8.2 },
              { label: 'Char.', score: 7.4 },
              { label: 'Theme', score: 8.0 },
              { label: 'Tech.', score: 8.6 },
              { label: 'Overall', score: 8.1 },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1">
                <div className="relative w-10 h-10">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(44,36,22,0.12)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#A67C3B" strokeWidth="3"
                            strokeDasharray={`${(s.score / 10) * 100} 100`} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#A67C3B]">
                    {s.score}
                  </span>
                </div>
                <span className="text-[10px] text-[#8A7F6A]">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      );
    case 'download':
      return (
        <div className={wrap}>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#9C917D] mb-4">Save your chapter</p>
          <div className="space-y-2">
            {[
              { label: '.txt — Plain text',   featured: false },
              { label: '.docx — Word doc',    featured: true  },
              { label: '.pdf — Print-ready',  featured: false },
            ].map((f) => (
              <div
                key={f.label}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm
                  ${f.featured
                    ? 'border border-[#A67C3B]/50 bg-[rgba(166,124,59,0.07)] text-[#2C2416]'
                    : 'border border-[rgba(44,36,22,0.15)] text-[#6E6350]'}
                `}
              >
                <span className={f.featured ? 'text-[#A67C3B]' : 'text-[#9C917D]'} aria-hidden="true">⬇</span>
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
      <div className="bg-kitabi-night">
        {/* HERO */}
        <section className="min-h-[70vh] flex flex-col justify-center px-6 sm:px-12 lg:px-24 py-20 relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 700px 500px at 30% 40%, rgba(212,168,91,0.12) 0%, transparent 65%)',
            }}
          />
          <div className="relative z-10">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="eyebrow mb-5"
            >
              The method
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-display text-5xl sm:text-6xl lg:text-7xl font-medium mb-6 text-kitabi-ivory leading-[1.05]"
            >
              How it <em className="foil italic">works</em>.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-xl sm:text-2xl text-kitabi-stone max-w-2xl leading-relaxed"
            >
              The path from "idea" to "finished book." Five steps. Each one removes a reason people quit.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex gap-3 mt-12"
            >
              {STEPS.map((s) => (
                <a
                  key={s.number}
                  href={`#step-${s.number}`}
                  className="w-11 h-11 rounded-full border border-seam
                             flex items-center justify-center font-display text-lg text-kitabi-stone
                             hover:border-gilt hover:text-kitabi-gold transition-colors"
                >
                  {s.number}
                </a>
              ))}
            </motion.div>
          </div>
        </section>

        {/* STEPS */}
        <section className="px-6 sm:px-12 lg:px-24 py-20 lg:py-28 space-y-24 lg:space-y-36">
          {STEPS.map((step, idx) => {
            const reversed = idx % 2 === 1;
            return (
              <motion.div
                key={step.number}
                id={`step-${step.number}`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true, margin: '-100px' }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center"
              >
                {/* Text */}
                <div className={reversed ? 'lg:order-2' : 'lg:order-1'}>
                  <div className="flex items-baseline gap-4 mb-6">
                    <span className="font-display text-4xl font-medium text-kitabi-gold leading-none">
                      {step.number}
                    </span>
                    <span className="flex-1 max-w-[80px] h-px bg-gilt self-center" aria-hidden="true" />
                  </div>

                  <h2 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-medium mb-5 text-kitabi-ivory leading-tight">
                    {step.title}
                  </h2>
                  <p className="text-base sm:text-lg text-kitabi-stone leading-relaxed max-w-md">
                    {step.description}
                  </p>
                </div>

                {/* Visual mockup — a lit sheet of paper */}
                <div className={reversed ? 'lg:order-1' : 'lg:order-2'}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                    className="flex items-center justify-center py-6"
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
            className="bg-kitabi-night-soft rounded-lg p-8 sm:p-10 lg:p-14 border border-seam"
          >
            <p className="eyebrow text-center mb-3">The standard</p>
            <h2 className="font-display text-3xl sm:text-4xl font-medium mb-12 text-center text-kitabi-ivory">
              Our quality promise
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-10">
              {PROMISES.map((item) => (
                <div key={item.label} className="min-w-0 text-center sm:border-l sm:border-seam sm:first:border-0 px-4">
                  <div className="text-4xl sm:text-5xl font-display font-medium text-kitabi-gold mb-3 leading-none whitespace-nowrap">
                    {item.number}
                  </div>
                  <h3 className="font-semibold text-base mb-1.5 text-kitabi-ivory">{item.label}</h3>
                  <p className="text-kitabi-stone text-sm">{item.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* CTA */}
        <section className="px-6 sm:px-12 lg:px-24 py-20 lg:py-28 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-medium mb-5 text-kitabi-ivory">
              Ready to start your book?
            </h2>
            <p className="text-lg text-kitabi-stone mb-10">
              Write Chapter 1 free. No signup. See how it feels.
            </p>
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
