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
    chapterPercent >= 100 ? 'bg-red-500' :
    chapterPercent >= 80  ? 'bg-amber-500' :
                            'bg-[#C8964D]';

  return (
    <div className="rounded-lg bg-white border border-gray-200 p-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-3">Your usage</p>

      {/* Chapters this month */}
      <div className="mb-3.5">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-gray-600">Chapters this month</span>
          <span className="font-semibold text-[#1A1A1A]">
            {chapters.used} / {chapters.max}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
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
          <span className="text-gray-600">Words this month</span>
          <span className="font-semibold text-[#1A1A1A]">
            {words.used.toLocaleString()} / {words.max.toLocaleString()}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-500"
            style={{ width: `${wordPercent}%` }}
            role="progressbar"
            aria-valuenow={words.used}
            aria-valuemin={0}
            aria-valuemax={words.max}
          />
        </div>
      </div>

      <p className="text-[11px] text-gray-500">
        Each chapter: 1,500–2,500 words
      </p>

      {/* Approaching-limit upsell */}
      {nearLimit && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-[11px] font-semibold text-[#1A1A1A] mb-1">
            {chapterPercent >= 100 ? 'Monthly limit reached' : 'Almost at your limit'}
          </p>
          <p className="text-[11px] text-gray-600 mb-2 leading-snug">
            Upgrade to Author for 25 chapters / 62,500 words per month.
          </p>
          <Link
            to="/pricing"
            className="text-[11px] font-semibold text-[#C8964D] hover:text-[#b88340]"
          >
            See plans →
          </Link>
        </div>
      )}
    </div>
  );
}
