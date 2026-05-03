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
              className={`px-4 py-1.5 rounded-full text-sm border transition-all ${
                active
                  ? 'border-[#C8964D] bg-[#C8964D]/10 text-[#C8964D] font-medium'
                  : 'border-gray-300 text-gray-600 hover:border-[#C8964D]/60 hover:text-[#1A1A1A] bg-white'
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
            className={`p-5 rounded-xl border text-left transition-all duration-150 bg-white ${
              active
                ? 'border-[#C8964D] bg-[#FFF7EB] shadow-sm scale-[1.02]'
                : 'border-gray-200 hover:border-[#C8964D]/60 hover:scale-[1.01]'
            }`}
          >
            <div className="text-2xl mb-2">{g.icon}</div>
            <div className={`font-semibold mb-1 ${active ? 'text-[#C8964D]' : 'text-[#1A1A1A]'}`}>
              {g.label}
            </div>
            <div className="text-sm text-gray-600">{g.desc}</div>
          </button>
        );
      })}
    </div>
  );
}
