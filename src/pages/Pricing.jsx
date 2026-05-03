import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import PageLayout from '../components/PageLayout';

const TIERS = [
  {
    name: 'Starter',
    price: 'Free',
    period: 'Forever',
    description: 'Start your first book',
    features: [
      '3 chapters per month',
      '1,500–2,500 words per chapter',
      'Download as .txt',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Author',
    price: '$25',
    period: '/month',
    description: 'For writers shipping work',
    features: [
      '25 chapters per month',
      '1,500–2,500 words per chapter',
      'AI literary analysis',
      'AI rewrite & expand tools',
      'My Books library',
      'Download .txt · .docx · .pdf',
      'Writing coach',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
];

const COMPARISON = [
  { feature: 'Chapters / month',     starter: '3',         author: '25'         },
  { feature: 'Words per chapter',    starter: '1,500–2,500', author: '1,500–2,500' },
  { feature: 'AI Literary Analysis', starter: '✗',         author: '✓'          },
  { feature: 'My Books library',     starter: '✗',         author: '✓'          },
  { feature: 'Download formats',     starter: '.txt',      author: '.txt · .docx · .pdf' },
  { feature: 'Writing coach',        starter: '✗',         author: '✓'          },
];

const FAQ = [
  { q: 'Can I cancel anytime?',                         a: 'Yes. Cancel in settings anytime. No penalties, no questions.' },
  { q: 'Do you offer refunds?',                         a: '30-day money-back guarantee. If not satisfied, we refund it.' },
  { q: 'What happens to my chapters after I cancel?',   a: 'Your chapters stay forever. Download anytime, even after canceling.' },
  { q: 'Do you offer annual discounts?',                a: 'Yes. Pay annually, save 20% on Author — $240/year.' },
];

export default function Pricing() {
  return (
    <PageLayout>
      <div className="bg-white">
        {/* HERO */}
        <section className="min-h-[60vh] flex flex-col justify-center px-6 sm:px-12 lg:px-24 py-20">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-serif text-5xl sm:text-6xl lg:text-7xl font-medium mb-6 text-[#1A1A1A] leading-[1.05]"
          >
            Simple <span className="italic text-[#C8964D]">pricing</span>.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl sm:text-2xl lg:text-3xl text-gray-600 max-w-2xl"
          >
            Pay for what you use. Cancel anytime. No surprises.
          </motion.p>
        </section>

        {/* PRICING CARDS */}
        <section className="px-6 sm:px-12 lg:px-24 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-7 max-w-3xl mx-auto">
            {TIERS.map((tier, idx) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: tier.popular ? 1.04 : 1.03, y: -10 }}
                className={`relative rounded-2xl p-8 sm:p-10 transition-shadow duration-300 cursor-pointer
                  ${tier.popular
                    ? 'bg-gradient-to-br from-[#FFF7EB] to-white border-2 border-[#C8964D] shadow-2xl'
                    : 'bg-white border-2 border-gray-200 hover:border-[#C8964D] hover:shadow-lg'}
                `}
              >
                {tier.popular && (
                  <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="absolute -top-4 left-8 bg-[#C8964D] text-white px-5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase"
                  >
                    Most Popular
                  </motion.div>
                )}

                <h2 className="font-serif text-3xl font-medium mb-2 text-[#1A1A1A]">{tier.name}</h2>
                <p className="text-gray-600 mb-7 text-sm">{tier.description}</p>

                <div className="mb-7 pb-7 border-b-2 border-gray-200">
                  <p className="font-display text-5xl font-medium text-[#1A1A1A]">
                    {tier.price}
                    <span className="text-lg text-gray-600 ml-2 font-normal">{tier.period}</span>
                  </p>
                </div>

                <ul className="space-y-3 mb-9">
                  {tier.features.map((feature, fidx) => (
                    <motion.li
                      key={feature}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: fidx * 0.05 }}
                      viewport={{ once: true }}
                      className="flex items-start gap-3"
                    >
                      <span className="text-[#C8964D] font-bold text-lg leading-none mt-1" aria-hidden="true">✓</span>
                      <span className="text-gray-700">{feature}</span>
                    </motion.li>
                  ))}
                </ul>

                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  <Link
                    to="/"
                    className={`block w-full py-3 rounded-lg font-bold text-center transition-all
                      ${tier.popular
                        ? 'bg-[#C8964D] text-white hover:bg-[#b88340]'
                        : 'border-2 border-gray-300 text-[#1A1A1A] hover:border-[#C8964D] hover:text-[#C8964D]'}
                    `}
                  >
                    {tier.cta}
                  </Link>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* COMPARISON TABLE */}
        <section className="px-6 sm:px-12 lg:px-24 py-20">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium mb-10 text-[#1A1A1A]">
            Feature comparison
          </h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="overflow-x-auto rounded-2xl border-2 border-gray-200"
          >
            <table className="w-full text-sm sm:text-base">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="text-left p-4 sm:p-6 font-bold text-[#1A1A1A]">Feature</th>
                  <th className="text-center p-4 sm:p-6 font-bold text-[#1A1A1A]">Starter</th>
                  <th className="text-center p-4 sm:p-6 font-bold text-[#C8964D]">Author</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.feature} className="border-b border-gray-200 last:border-0 hover:bg-[#FFF7EB] transition">
                    <td className="p-4 sm:p-6 font-bold text-[#1A1A1A]">{row.feature}</td>
                    <td className="text-center p-4 sm:p-6 text-gray-700">{row.starter}</td>
                    <td className="text-center p-4 sm:p-6 text-[#C8964D] font-bold">{row.author}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </section>

        {/* PRICING FAQ */}
        <section className="px-6 sm:px-12 lg:px-24 py-20">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium mb-10 text-[#1A1A1A]">
            Pricing questions
          </h2>
          <div className="space-y-4 max-w-3xl">
            {FAQ.map((item, idx) => (
              <motion.details
                key={item.q}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                viewport={{ once: true }}
                className="border-2 border-gray-200 rounded-xl px-6 py-5 cursor-pointer group
                           hover:border-[#C8964D] hover:bg-[#FFF7EB] transition-all"
              >
                <summary className="font-bold text-base sm:text-lg flex justify-between items-center select-none text-[#1A1A1A] gap-4">
                  <span>{item.q}</span>
                  <span className="text-[#C8964D] text-xl group-open:rotate-180 transition-transform" aria-hidden="true">
                    ↓
                  </span>
                </summary>
                <p className="text-gray-700 mt-4 text-sm sm:text-base leading-relaxed">{item.a}</p>
              </motion.details>
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
              Start free. No credit card required.
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 mb-10">
              Generate your first chapter in minutes.
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
              <Link
                to="/"
                className="inline-block bg-[#C8964D] text-white px-12 sm:px-16 py-4 sm:py-5
                           rounded-xl font-bold text-base sm:text-xl hover:bg-[#b88340]
                           hover:shadow-2xl transition-all"
              >
                Start Free →
              </Link>
            </motion.div>
          </motion.div>
        </section>
      </div>
    </PageLayout>
  );
}
