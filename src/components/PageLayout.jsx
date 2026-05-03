import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Footer from './Footer';

// Note: page transition uses opacity + x only (no scale).
// Scale on a tall page can interact oddly with browser scroll-height calculation
// and causes the bottom of long pages to be unreachable.
const pageVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0,
             transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, x: -24,
             transition: { duration: 0.18, ease: 'easeIn' } },
};

/**
 * PageLayout — sidebar + main content area with page transition.
 * Use for marketing pages (How It Works, Pricing, About, FAQ).
 */
export default function PageLayout({ children }) {
  return (
    <div className="min-h-screen bg-white text-[#1A1A1A] flex">
      <Sidebar />

      <motion.main
        id="main-content"
        className="flex-1 lg:ml-80 mt-14 lg:mt-0 min-w-0 w-full flex flex-col"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div className="flex-1">{children}</div>
        <Footer />
      </motion.main>
    </div>
  );
}
