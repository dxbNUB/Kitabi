import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16 bg-kitabi-night">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-xl text-center"
      >
        <p className="font-display text-[120px] sm:text-[160px] font-medium text-kitabi-gold leading-none mb-2">
          404
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-medium text-kitabi-ivory mb-3">
          This page doesn't exist.
        </h1>
        <p className="text-base sm:text-lg text-kitabi-stone mb-10 max-w-md mx-auto">
          The chapter you're looking for may have been moved, deleted, or never written.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/')}
            className="px-7 py-3 btn-gold font-semibold
                       rounded-md transition-colors"
          >
            <span aria-hidden="true">←</span> Back to home
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-7 py-3 border border-seam hover:border-gilt text-kitabi-ivory
                       font-semibold rounded-md transition-colors"
          >
            Go back
          </button>
        </div>

        <div className="mt-12 pt-8 border-t border-seam">
          <p className="eyebrow mb-3">
            Or try one of these
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 justify-center text-sm text-kitabi-stone">
            <Link to="/how-it-works" className="hover:text-kitabi-gold transition">How it works</Link>
            <Link to="/pricing"      className="hover:text-kitabi-gold transition">Pricing</Link>
            <Link to="/about"        className="hover:text-kitabi-gold transition">About</Link>
            <Link to="/faq"          className="hover:text-kitabi-gold transition">FAQ</Link>
            <Link to="/compare"      className="hover:text-kitabi-gold transition">Compare</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
