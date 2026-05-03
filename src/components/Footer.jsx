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
    <footer className="border-t border-gray-200 bg-white mt-12">
      {/* Legal disclaimer block */}
      <div className="px-6 sm:px-12 lg:px-24 py-10 max-w-4xl">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2">
          Legal disclaimer
        </p>
        <p className="text-xs text-gray-600 leading-relaxed">
          Kitabi is a writing assistance tool. We do <strong className="text-[#1A1A1A]">not</strong> take responsibility for the accuracy or legality of content you generate, how you use it, the consequences of publication, or any violation of laws in your jurisdiction. You are solely responsible for verifying accuracy, obtaining permissions, ensuring legal compliance, and fact-checking before publishing. By using Kitabi you agree to our{' '}
          <Link to="/terms" className="text-[#C8964D] underline underline-offset-2">Terms of Service</Link>{' '}and accept all liability for your content.
        </p>
      </div>

      {/* Bottom row */}
      <div className="border-t border-gray-100 px-6 sm:px-12 lg:px-24 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <span className="text-xs text-gray-500">© Kitabi {year}</span>
        <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-gray-500">
          <Link to="/terms"           className="hover:text-[#C8964D] transition">Terms</Link>
          <Link to="/privacy"         className="hover:text-[#C8964D] transition">Privacy</Link>
          <Link to="/acceptable-use"  className="hover:text-[#C8964D] transition">Acceptable Use</Link>
          <Link to="/report-abuse"    className="hover:text-[#C8964D] transition">Report Abuse</Link>
          <Link to="/compare"         className="hover:text-[#C8964D] transition">Compare</Link>
          <a href="mailto:hello@kitabi.ink" className="hover:text-[#C8964D] transition">Contact</a>
        </nav>
      </div>
    </footer>
  );
}
