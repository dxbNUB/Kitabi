import { useSession } from '../store/session';
import { analytics } from '../lib/analytics';

const GENRES = [
  { id: 'thriller',   label: 'Thriller',   icon: '🔪', desc: 'Someone knows too much. Now they\'re in danger.' },
  { id: 'fantasy',    label: 'Fantasy',    icon: '⚔️', desc: 'A world that couldn\'t exist, but should.' },
  { id: 'scifi',      label: 'Sci-Fi',     icon: '🚀', desc: 'The future, crashing into the present.' },
  { id: 'historical', label: 'Historical', icon: '📜', desc: 'The past, made alive.' },
  { id: 'business',   label: 'Business',   icon: '💡', desc: 'The idea that changes how people think.' },
];

export default function GenreSelector({ variant = 'pills', onSelect }) {
  const { genre, setGenre } = useSession();

  const handleSelect = (id) => {
    analytics.genreSelected(id, variant);
    setGenre(id);
    onSelect?.(id);
  };

  if (variant === 'pills') {
    return (
      <div className="flex flex-wrap gap-2 justify-center" role="group" aria-label="Choose a genre">
        {GENRES.map((g) => {
          const active = genre === g.id;
          return (
            <button
              key={g.id}
              onClick={() => handleSelect(g.id)}
              aria-pressed={active}
              className={`px-4 py-1.5 rounded-full text-sm border transition-all duration-200 hover:-translate-y-0.5 ${
                active
                  ? 'border-kitabi-gold bg-[rgba(212,168,91,0.14)] text-kitabi-gold font-medium shadow-[0_4px_16px_-6px_rgba(212,168,91,0.4)]'
                  : 'border-seam text-kitabi-stone hover:border-gilt hover:text-kitabi-ivory bg-transparent'
              }`}
            >
              {g.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {GENRES.map((g) => {
        const active = genre === g.id;
        return (
          <button
            key={g.id}
            onClick={() => handleSelect(g.id)}
            aria-pressed={active}
            className={`p-5 rounded-lg border text-left transition-all duration-150 ${
              active
                ? 'border-kitabi-gold bg-[rgba(201,162,92,0.08)] shadow-raise scale-[1.02]'
                : 'border-seam bg-kitabi-night-soft hover:border-gilt hover:scale-[1.01]'
            }`}
          >
            <div className="text-2xl mb-2">{g.icon}</div>
            <div className={`font-semibold mb-1 ${active ? 'text-kitabi-gold' : 'text-kitabi-ivory'}`}>
              {g.label}
            </div>
            <div className="text-sm text-kitabi-stone">{g.desc}</div>
          </button>
        );
      })}
    </div>
  );
}
