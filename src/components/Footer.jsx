import { Link } from 'react-router-dom';

/**
 * Site footer with legal disclaimer + links to legal pages.
 * Mounted in PageLayout (marketing pages) and Landing.
 *
 * The disclaimer paragraph is the user-facing summary required on every page —
 * the full text lives in /terms, /privacy, /acceptable-use.
 */
export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-seam bg-kitabi-night mt-12">
      {/* Legal disclaimer block */}
      <div className="px-6 sm:px-12 lg:px-24 py-10 max-w-4xl">
        <p className="eyebrow mb-3">
          Legal disclaimer
        </p>
        <p className="text-xs text-kitabi-faded leading-relaxed">
          Kitabi is a writing assistance tool. We do <strong className="text-kitabi-stone font-semibold">not</strong> take responsibility for the accuracy or legality of content you generate, how you use it, the consequences of publication, or any violation of laws in your jurisdiction. You are solely responsible for verifying accuracy, obtaining permissions, ensuring legal compliance, and fact-checking before publishing. By using Kitabi you agree to our{' '}
          <Link to="/terms" className="text-kitabi-gold underline underline-offset-2 decoration-[rgba(201,162,92,0.4)] hover:decoration-kitabi-gold transition">Terms of Service</Link>{' '}and accept all liability for your content.
        </p>
      </div>

      {/* Bottom row */}
      <div className="border-t border-seam px-6 sm:px-12 lg:px-24 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <span className="text-xs text-kitabi-faded">© Kitabi {year}</span>
        <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-kitabi-stone">
          <Link to="/terms"           className="hover:text-kitabi-gold transition">Terms</Link>
          <Link to="/privacy"         className="hover:text-kitabi-gold transition">Privacy</Link>
          <Link to="/acceptable-use"  className="hover:text-kitabi-gold transition">Acceptable Use</Link>
          <Link to="/report-abuse"    className="hover:text-kitabi-gold transition">Report Abuse</Link>
          <Link to="/compare"         className="hover:text-kitabi-gold transition">Compare</Link>
          <a href="mailto:hello@kitabi.ink" className="hover:text-kitabi-gold transition">Contact</a>
        </nav>
      </div>
    </footer>
  );
}
