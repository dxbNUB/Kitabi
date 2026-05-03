import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import PageLayout from '../components/PageLayout';

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

const TEAM = [
  {
    initials: 'CEO',
    name: 'CEO & Founder',
    role: 'Technical Lead',
    bio: 'Built AI systems for 5 years. Obsessed with democratizing expertise.',
  },
  {
    initials: 'LA',
    name: 'Literary Advisor',
    role: 'Published Author & Editor',
    bio: 'Edited 50+ books. Ensures literary quality never takes a backseat.',
  },
  {
    initials: 'DL',
    name: 'Design Lead',
    role: 'Product Designer',
    bio: 'Believes software should disappear. You should feel like you are writing.',
  },
];

export default function About() {
  return (
    <PageLayout>
      <div className="bg-white">
        {/* HERO */}
        <section className="min-h-[80vh] flex flex-col justify-center px-6 sm:px-12 lg:px-24 py-20 relative overflow-hidden">
          <div className="absolute top-40 right-40 w-96 h-96 bg-[#FFE4B8] rounded-full blur-3xl opacity-30 animate-pulse" aria-hidden="true" />

          <div className="relative z-10">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-serif text-5xl sm:text-6xl lg:text-7xl font-medium mb-7 text-[#1A1A1A] leading-[1.05]"
            >
              We're <span className="italic text-[#C8964D]">innovating</span> how books get written.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-xl sm:text-2xl lg:text-3xl text-gray-600 max-w-3xl leading-relaxed"
            >
              For 500 years, you needed to be a writer to make a book.
              <br />
              We're changing that.
            </motion.p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12 mt-14 max-w-3xl">
              {STATS.map((stat, idx) => (
                <motion.div
                  key={stat.unit}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 + idx * 0.1 }}
                  whileHover={{ x: 6 }}
                  className="border-l-4 border-[#C8964D] pl-5 py-3 transition-all"
                >
                  <div className="font-display text-4xl sm:text-5xl font-medium text-[#C8964D] mb-1">{stat.number}</div>
                  <div className="font-bold text-base sm:text-lg text-[#1A1A1A]">{stat.unit}</div>
                  <p className="text-gray-600 text-sm">{stat.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* THE PROBLEM */}
        <section className="px-6 sm:px-12 lg:px-24 py-20 lg:py-32">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium mb-12 text-[#1A1A1A]"
          >
            How books get written today
          </motion.h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {PROBLEM_SIDES.map((side, idx) => (
              <motion.div
                key={side.title}
                initial={{ opacity: 0, x: idx === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                whileHover={{ y: -6 }}
                className="bg-white rounded-2xl p-8 sm:p-12 border-2 border-gray-200 hover:border-gray-400 hover:shadow-xl transition-all"
              >
                <p className="text-xs text-gray-500 uppercase tracking-[0.2em] mb-3">{side.label}</p>
                <h3 className="font-serif text-2xl sm:text-3xl font-medium mb-7 text-[#1A1A1A]">{side.title}</h3>
                <ul className="space-y-3">
                  {side.items.map((item, iidx) => (
                    <motion.li
                      key={item}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: iidx * 0.05 }}
                      viewport={{ once: true }}
                      className="flex items-start gap-3 text-gray-700 text-sm sm:text-base"
                    >
                      <span className="text-red-500 font-bold mt-0.5 flex-shrink-0" aria-hidden="true">×</span>
                      <span>{item}</span>
                    </motion.li>
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
            className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium mb-12 text-[#1A1A1A] text-center"
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
                whileHover={{ y: -8 }}
                className="p-8 bg-white rounded-2xl border-2 border-gray-200 hover:border-[#C8964D] hover:shadow-xl transition-all"
              >
                <p className="font-display text-3xl text-[#C8964D] mb-4 font-medium">
                  {String(idx + 1).padStart(2, '0')}
                </p>
                <h3 className="font-serif text-xl sm:text-2xl mb-3 text-[#1A1A1A]">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* TEAM */}
        <section className="mx-6 sm:mx-12 lg:mx-24 my-20 px-6 sm:px-12 py-16 lg:py-24 bg-gradient-to-br from-[#FFF7EB] via-white to-[#FFE4B8]/40 rounded-3xl border border-[#C8964D]/20">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium mb-12 text-[#1A1A1A] text-center"
          >
            Built by people who love books
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {TEAM.map((member, idx) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -6 }}
                className="text-center p-8 bg-white rounded-2xl border border-gray-200 hover:border-[#C8964D] hover:shadow-xl transition-all"
              >
                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-[#FFF7EB] border border-[#C8964D]/30 flex items-center justify-center">
                  <span className="font-display text-xl font-medium text-[#C8964D] tracking-wider">
                    {member.initials}
                  </span>
                </div>
                <h3 className="font-serif text-xl text-[#1A1A1A] mb-1">{member.name}</h3>
                <p className="text-[#C8964D] font-medium mb-3 text-xs uppercase tracking-[0.12em]">{member.role}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{member.bio}</p>
              </motion.div>
            ))}
          </div>
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
              Start free. No credit card. Generate your first chapter now.
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
              <Link
                to="/"
                className="inline-block bg-[#C8964D] text-white px-12 sm:px-16 py-4 sm:py-5
                           rounded-xl font-bold text-base sm:text-xl hover:bg-[#b88340]
                           hover:shadow-2xl transition-all"
              >
                Start Writing →
              </Link>
            </motion.div>
          </motion.div>
        </section>
      </div>
    </PageLayout>
  );
}
