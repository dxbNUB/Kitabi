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
        // Kitabi design tokens — "writing room after dark"
        kitabi: {
          // Dark ground: warm espresso-black, never pure black
          night:        '#16120C',
          'night-soft': '#211A11',
          'night-raise': '#2B2216',
          // Text on dark
          ivory:  '#F2E9D7',
          stone:  '#B0A48C',
          faded:  '#7A6E58',
          // Gilt accent — brighter, with fire
          gold:        '#D4A85B',
          'gold-bright': '#EBCA8A',
          'gold-deep': '#A67C3B',
          'gold-soft': 'rgba(212, 168, 91, 0.65)',
          // Paper surfaces (the bright objects on the desk)
          paper:  '#FDFAF5',
          // Legacy keys — still referenced by older classes
          ink:      '#111111',
          'ink-soft': '#1a1a1a',
          cream:    '#F5EFE2',
          'cream-soft': '#efe7d4',
          saffron:  '#C9A25C',
          'saffron-muted': 'rgba(201, 162, 92, 0.65)',
          indigo:   '#1B2A4E',
        },
      },
      borderColor: {
        // Gilt hairline + quiet structural line for dark surfaces
        gilt:  'rgba(201, 162, 92, 0.28)',
        seam:  'rgba(237, 228, 211, 0.09)',
      },
      boxShadow: {
        // Warm, soft lift for the paper sheet on the dark desk
        sheet: '0 1px 2px rgba(0,0,0,0.35), 0 12px 40px -8px rgba(0,0,0,0.55), 0 0 80px -20px rgba(201,162,92,0.18)',
        raise: '0 1px 0 rgba(237,228,211,0.05) inset, 0 8px 24px -12px rgba(0,0,0,0.6)',
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
