/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        // Full fallback stacks so a Google-Fonts outage degrades gracefully
        // instead of dropping to a quirky default that mis-renders glyphs.
        // Crimson Pro replaces Playfair Display for serif body text — its
        // 't' crossbar is visibly thicker at typical reading sizes.
        serif: [
          '"Crimson Pro"', '"Iowan Old Style"', '"Apple Garamond"',
          'Baskerville', 'Georgia', '"Times New Roman"', 'serif',
        ],
        sans: [
          'Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"',
          'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', '"Helvetica Neue"',
          'Helvetica', 'Arial', 'sans-serif',
        ],
        display: [
          '"Cormorant Garamond"', 'Garamond', 'Georgia', '"Times New Roman"', 'serif',
        ],
        // Playfair Display kept for legacy/decorative accents (drop-cap, occasional)
        playfair: [
          '"Playfair Display"', 'Georgia', 'serif',
        ],
        arabic: [
          '"Reem Kufi"', '"IBM Plex Sans Arabic"', '"Geeza Pro"', 'Tahoma', 'serif',
        ],
      },
      colors: {
        amber: { 400: '#F5A623', 500: '#e8961a' },
        parchment: '#FDFAF5',
        ink: '#1a1a1a',
        'ink-muted': '#6B5E4E',
        // Kitabi design tokens
        kitabi: {
          ink:      '#111111',
          'ink-soft': '#1a1a1a',
          cream:    '#F5EFE2',
          'cream-soft': '#efe7d4',
          saffron:  '#C8964D',
          'saffron-muted': 'rgba(200, 150, 77, 0.65)',
          indigo:   '#1B2A4E',
        },
      },
      animation: {
        'quill':   'quill 2s ease-in-out infinite',
        'fade-up': 'fadeUp 0.6s ease forwards',
      },
      keyframes: {
        quill:  { '0%, 100%': { transform: 'rotate(-5deg)' }, '50%': { transform: 'rotate(5deg)' } },
        fadeUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
