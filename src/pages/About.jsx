import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import { useSEO } from '../lib/seo';

const STATS = [
  { number: '500',  unit: 'years', desc: 'Writers gatekept the printed word' },
  { number: '10', unit: 'minutes', desc: 'From idea to your first chapter' },
  { number: '10K+', unit: 'books',  desc: 'Bestsellers our system trained on' },
];

const PROBLEM_SIDES = [
  {
    label: 'Traditional',
    title: 'Going through a publisher',
    items: ['18-24 months from acceptance to shelf', '$4K-10K average advance', 'Requires an agent — 98% rejection rate', 'Limited control over cover and pricing', 'Royalties: 8-15% of net'],
  },
  {
    label: 'Self-published',
    title: 'Doing it all yourself',
    items: ['4-8 weeks of formatting and metadata', 'ISBN registration, cover design, layout', 'Confusing keyword and category research', 'Steep learning curve', 'Often produces visibly amateur results'],
  },
];

const SOLUTION = [
  { title: 'AI trained on 10,000 books',  desc: 'Learned from bestsellers and what real critics consistently praise. Genre-aware craft, not generic prose.' },
  { title: 'Literary analysis at scale',  desc: 'Every chapter gets expert-level feedback on pacing, dialogue, sensory specificity, and theme.' },
  { title: 'Two things, done well',        desc: 'Write and analyze. No bloat, no abandoned features. The whole product is what it claims to be.' },
];

export default function About() {
  useSEO({
    title: 'About Kitabi — AI Writing Assistant Built for Novelists',
    description: 'Kitabi is an AI writing assistant trained on 10,000 bestsellers. Built to help writers turn ideas into finished books — chapter by chapter — without the gatekeeping of traditional publishing or the bloat of self-publishing.',
    canonical: 'https://kitabi.ink/about',
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
                'radial-gradient(ellipse 700px 500px at 70% 30%, rgba(201,162,92,0.07) 0%, transparent 65%)',
            }}
          />

          <div className="relative z-10">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="eyebrow mb-5"
            >
              About Kitabi
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-display text-5xl sm:text-6xl lg:text-7xl font-medium mb-7 text-kitabi-ivory leading-[1.05]"
            >
              We're changing how <em className="italic text-kitabi-gold">books</em> get written.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-xl sm:text-2xl text-kitabi-stone max-w-3xl leading-relaxed"
            >
              For 500 years, you needed to be a writer to make a book.
              <br />
              Not anymore.
            </motion.p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12 mt-14 max-w-3xl">
              {STATS.map((stat, idx) => (
                <motion.div
                  key={stat.unit}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + idx * 0.1 }}
                  className="border-l-2 border-gilt pl-5 py-3"
                >
                  <div className="font-display text-4xl sm:text-5xl font-medium text-kitabi-gold mb-1">{stat.number}</div>
                  <div className="font-semibold text-base text-kitabi-ivory">{stat.unit}</div>
                  <p className="text-kitabi-stone text-sm mt-1">{stat.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* THE PROBLEM */}
        <section className="px-6 sm:px-12 lg:px-24 py-20 lg:py-28">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="font-display text-3xl sm:text-4xl lg:text-5xl font-medium mb-12 text-kitabi-ivory"
          >
            How books get written today
          </motion.h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
            {PROBLEM_SIDES.map((side) => (
              <motion.div
                key={side.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="bg-kitabi-night-soft rounded-lg p-8 sm:p-12 border border-seam"
              >
                <p className="eyebrow mb-3">{side.label}</p>
                <h3 className="font-display text-2xl sm:text-3xl font-medium mb-7 text-kitabi-ivory">{side.title}</h3>
                <ul className="space-y-3">
                  {side.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-kitabi-stone text-sm sm:text-base"
                    >
                      <span className="text-[#B05C42] font-bold mt-0.5 flex-shrink-0" aria-hidden="true">×</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </section>

        {/* THE SOLUTION */}
        <section className="px-6 sm:px-12 lg:px-24 py-20">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="font-display text-3xl sm:text-4xl lg:text-5xl font-medium mb-12 text-kitabi-ivory text-center"
          >
            Our solution: AI that understands books
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-7">
            {SOLUTION.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="p-8 bg-kitabi-night-soft rounded-lg border border-seam hover:border-gilt transition-colors"
              >
                <span className="block w-10 h-px bg-gilt mb-6" aria-hidden="true" />
                <h3 className="font-display text-xl sm:text-2xl mb-3 text-kitabi-ivory">{item.title}</h3>
                <p className="text-kitabi-stone leading-relaxed text-sm sm:text-base">{item.desc}</p>
              </motion.div>
            ))}
          </div>
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
              Start free. No credit card. Generate your first chapter now.
            </p>
            <Link
              to="/"
              className="inline-block bg-kitabi-gold text-kitabi-night px-12 py-4
                         rounded-md font-semibold text-base sm:text-lg hover:bg-kitabi-gold-deep hover:text-kitabi-paper
                         transition-colors"
            >
              Start writing →
            </Link>
          </motion.div>
        </section>
      </div>
    </PageLayout>
  );
}
