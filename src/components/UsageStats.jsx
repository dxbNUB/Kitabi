import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';

/**
 * Displays the current user's monthly chapter + word usage.
 * Polls /api/usage on mount and after each generation (refreshKey changes).
 *
 * Today: IP-keyed on the server. When Firebase auth lands, the same component
 * works unchanged — only the server's keying flips from IP → userId.
 */
export default function UsageStats({ refreshKey = 0 }) {
  const [usage, setUsage] = useState(null);

  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch('/api/usage');
      if (!res.ok) return;
      const data = await res.json();
      setUsage(data);
    } catch {/* offline / api down — fail silent */}
  }, []);

  useEffect(() => { fetchUsage(); }, [fetchUsage, refreshKey]);

  if (!usage?.monthly) return null;

  const { chapters, words, wordsPerChapter } = usage.monthly;
  const chapterPercent = Math.min(100, Math.round((chapters.used / chapters.max) * 100));
  const wordPercent    = Math.min(100, Math.round((words.used    / words.max)    * 100));
  const nearLimit      = chapterPercent >= 80;

  const chapterBarColor =
    chapterPercent >= 100 ? 'bg-red-400' :
    chapterPercent >= 80  ? 'bg-[#D8B36A]' :
                            'bg-kitabi-gold';

  return (
    <div className="rounded-lg bg-[rgba(237,228,211,0.03)] border border-seam p-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-kitabi-faded mb-3">Your usage</p>

      {/* Chapters this month */}
      <div className="mb-3.5">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-kitabi-stone">Chapters this month</span>
          <span className="font-semibold text-kitabi-ivory">
            {chapters.used} / {chapters.max}
          </span>
        </div>
        <div className="w-full bg-[rgba(237,228,211,0.1)] rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${chapterBarColor}`}
            style={{ width: `${chapterPercent}%` }}
            role="progressbar"
            aria-valuenow={chapters.used}
            aria-valuemin={0}
            aria-valuemax={chapters.max}
          />
        </div>
      </div>

      {/* Words this month */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-kitabi-stone">Words this month</span>
          <span className="font-semibold text-kitabi-ivory">
            {words.used.toLocaleString()} / {words.max.toLocaleString()}
          </span>
        </div>
        <div className="w-full bg-[rgba(237,228,211,0.1)] rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full rounded-full bg-[rgba(201,162,92,0.5)] transition-all duration-500"
            style={{ width: `${wordPercent}%` }}
            role="progressbar"
            aria-valuenow={words.used}
            aria-valuemin={0}
            aria-valuemax={words.max}
          />
        </div>
      </div>

      <p className="text-[11px] text-kitabi-faded">
        Each chapter: 1,500–2,500 words
      </p>

      {/* Approaching-limit upsell */}
      {nearLimit && (
        <div className="mt-3 pt-3 border-t border-seam">
          <p className="text-[11px] font-semibold text-kitabi-ivory mb-1">
            {chapterPercent >= 100 ? 'Monthly limit reached' : 'Almost at your limit'}
          </p>
          <p className="text-[11px] text-kitabi-stone mb-2 leading-snug">
            Upgrade to Author for 25 chapters / 62,500 words per month.
          </p>
          <Link
            to="/pricing"
            className="text-[11px] font-semibold text-kitabi-gold hover:text-kitabi-ivory"
          >
            See plans →
          </Link>
        </div>
      )}
    </div>
  );
}
