import { useSession } from '../store/session';
import { analytics } from '../lib/analytics';

// Lives inside the paper sheet on Landing — styled for a light surface.
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
        <span className="text-[#8A7F6A] hidden sm:inline">I'm a:</span>
        <div className="flex rounded-md overflow-hidden border border-[rgba(44,36,22,0.2)]">
          <button
            onClick={() => toggle('nonwriter')}
            aria-pressed={mode === 'nonwriter'}
            className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm transition-colors ${
              mode === 'nonwriter'
                ? 'bg-kitabi-gold-deep text-kitabi-paper font-medium'
                : 'bg-transparent text-[#6E6350] hover:text-[#2C2416] hover:bg-[rgba(44,36,22,0.05)]'
            }`}
          >
            New Writer
          </button>
          <button
            onClick={() => toggle('writer')}
            aria-pressed={mode === 'writer'}
            className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm transition-colors ${
              mode === 'writer'
                ? 'bg-kitabi-gold-deep text-kitabi-paper font-medium'
                : 'bg-transparent text-[#6E6350] hover:text-[#2C2416] hover:bg-[rgba(44,36,22,0.05)]'
            }`}
          >
            Experienced
          </button>
        </div>
      </div>
      <p className="text-[11px] text-[#8A7F6A] italic" key={mode}>
        {description}
      </p>
    </div>
  );
}
