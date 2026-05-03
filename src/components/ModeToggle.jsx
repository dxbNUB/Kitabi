import { useSession } from '../store/session';
import { analytics } from '../lib/analytics';

export default function ModeToggle() {
  const { mode, setMode } = useSession();

  const toggle = (newMode) => {
    if (newMode === mode) return;
    analytics.modeSwitched(mode, newMode);
    setMode(newMode);
  };

  const description = mode === 'writer'
    ? "You've finished before. We'll skip the basics and push the craft."
    : "First time finishing a book? We'll guide every chapter, no jargon.";

  return (
    <div className="flex flex-col gap-1.5" role="group" aria-label="Writer experience level">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-500 hidden sm:inline">I'm a:</span>
        <div className="flex rounded-lg overflow-hidden border border-gray-300 bg-white">
          <button
            onClick={() => toggle('nonwriter')}
            aria-pressed={mode === 'nonwriter'}
            className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm transition-colors ${
              mode === 'nonwriter'
                ? 'bg-[#C8964D] text-white font-medium'
                : 'bg-transparent text-gray-600 hover:text-[#1A1A1A] hover:bg-gray-50'
            }`}
          >
            New Writer
          </button>
          <button
            onClick={() => toggle('writer')}
            aria-pressed={mode === 'writer'}
            className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm transition-colors ${
              mode === 'writer'
                ? 'bg-[#C8964D] text-white font-medium'
                : 'bg-transparent text-gray-600 hover:text-[#1A1A1A] hover:bg-gray-50'
            }`}
          >
            Experienced
          </button>
        </div>
      </div>
      <p className="text-[11px] text-gray-500 italic" key={mode}>
        {description}
      </p>
    </div>
  );
}
