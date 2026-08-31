import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import { useSEO } from '../lib/seo';

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
    cta: 'Get started',
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
    cta: 'Start free trial',
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
  useSEO({
    title: 'Pricing — Free & Author Plans | Kitabi AI Writer',
    description: 'Kitabi pricing: Free Starter (3 chapters/month, 1,500–2,500 words each) and Author plan ($25/month, 25 chapters/month, unlimited downloads, AI rewrite tools). AI writing assistant for novelists.',
    canonical: 'https://kitabi.ink/pricing',
    image: 'https://kitabi.ink/og-image.svg',
  });

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
            Plans
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-display text-5xl sm:text-6xl lg:text-7xl font-medium mb-6 text-kitabi-ivory leading-[1.05]"
          >
            Simple <em className="italic text-kitabi-gold">pricing</em>.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl sm:text-2xl text-kitabi-stone max-w-2xl"
          >
            Pay for what you use. Cancel anytime. No surprises.
          </motion.p>
        </section>

        {/* PRICING CARDS */}
        <section className="px-6 sm:px-12 lg:px-24 py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-7 max-w-3xl mx-auto">
            {TIERS.map((tier, idx) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className={`relative rounded-lg p-8 sm:p-10 transition-colors duration-300
                  ${tier.popular
                    ? 'bg-kitabi-night-soft border border-gilt shadow-raise'
                    : 'bg-kitabi-night-soft border border-seam hover:border-gilt'}
                `}
              >
                {tier.popular && (
                  <div
                    className="absolute -top-3 left-8 bg-kitabi-gold text-kitabi-night px-4 py-1 rounded-full text-[10px] font-bold tracking-[0.18em] uppercase"
                  >
                    Most popular
                  </div>
                )}

                <h2 className="font-display text-3xl font-medium mb-2 text-kitabi-ivory">{tier.name}</h2>
                <p className="text-kitabi-stone mb-7 text-sm">{tier.description}</p>

                <div className="mb-7 pb-7 border-b border-seam">
                  <p className="font-display text-5xl font-medium text-kitabi-ivory">
                    {tier.price}
                    <span className="text-lg text-kitabi-stone ml-2 font-normal">{tier.period}</span>
                  </p>
                </div>

                <ul className="space-y-3 mb-9">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <span className="text-kitabi-gold text-base leading-none mt-1" aria-hidden="true">✓</span>
                      <span className="text-kitabi-stone">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/"
                  className={`block w-full py-3 rounded-md font-semibold text-center transition-colors
                    ${tier.popular
                      ? 'bg-kitabi-gold text-kitabi-night hover:bg-kitabi-gold-deep hover:text-kitabi-paper'
                      : 'border border-seam text-kitabi-ivory hover:border-gilt hover:text-kitabi-gold'}
                  `}
                >
                  {tier.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* COMPARISON TABLE */}
        <section className="px-6 sm:px-12 lg:px-24 py-20">
          <h2 className="font-display text-3xl sm:text-4xl font-medium mb-10 text-kitabi-ivory">
            Feature comparison
          </h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="overflow-x-auto rounded-lg border border-seam"
          >
            <table className="w-full text-sm sm:text-base">
              <thead>
                <tr className="bg-kitabi-night-soft border-b border-seam">
                  <th className="text-left p-4 sm:p-5 font-semibold text-kitabi-ivory">Feature</th>
                  <th className="text-center p-4 sm:p-5 font-semibold text-kitabi-ivory">Starter</th>
                  <th className="text-center p-4 sm:p-5 font-semibold text-kitabi-gold">Author</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.feature} className="border-b border-seam last:border-0 hover:bg-[rgba(201,162,92,0.04)] transition-colors">
                    <td className="p-4 sm:p-5 font-medium text-kitabi-ivory">{row.feature}</td>
                    <td className="text-center p-4 sm:p-5 text-kitabi-stone">{row.starter}</td>
                    <td className="text-center p-4 sm:p-5 text-kitabi-gold font-medium">{row.author}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </section>

        {/* PRICING FAQ */}
        <section className="px-6 sm:px-12 lg:px-24 py-20">
          <h2 className="font-display text-3xl sm:text-4xl font-medium mb-10 text-kitabi-ivory">
            Pricing questions
          </h2>
          <div className="space-y-3 max-w-3xl">
            {FAQ.map((item, idx) => (
              <motion.details
                key={item.q}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                viewport={{ once: true }}
                className="border border-seam rounded-lg px-6 py-5 cursor-pointer group
                           hover:border-gilt transition-colors bg-kitabi-night-soft"
              >
                <summary className="font-medium text-base sm:text-lg flex justify-between items-center select-none text-kitabi-ivory gap-4">
                  <span>{item.q}</span>
                  <span className="text-kitabi-gold text-lg group-open:rotate-180 transition-transform" aria-hidden="true">
                    ↓
                  </span>
                </summary>
                <p className="text-kitabi-stone mt-4 text-sm sm:text-base leading-relaxed">{item.a}</p>
              </motion.details>
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
              Start free. No credit card required.
            </h2>
            <p className="text-lg text-kitabi-stone mb-10">
              Generate your first chapter in minutes.
            </p>
            <Link
              to="/"
              className="inline-block bg-kitabi-gold text-kitabi-night px-12 py-4
                         rounded-md font-semibold text-base sm:text-lg hover:bg-kitabi-gold-deep hover:text-kitabi-paper
                         transition-colors"
            >
              Start free →
            </Link>
          </motion.div>
        </section>
      </div>
    </PageLayout>
  );
}
