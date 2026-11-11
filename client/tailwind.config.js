/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warm paper-and-ink palette, retaining existing utility names.
        'yt-bg':     '#f4eddf',
        'yt-card':   '#fffaf0',
        'yt-hover':  '#eee3d0',
        'yt-line':   '#d2bea0',
        'yt-border': '#dfd1b9',
        'yt-text':   '#35291f',
        'yt-sub':    '#776859',
        'yt-red':    '#ad5738',
        'yt-muted':  '#9a8874',

        // Naqaa brand greens (kept for accents)
        naqaa: {
          50:  '#f0f9f4',
          100: '#dcf0e3',
          200: '#bbe1c9',
          300: '#8acaa6',
          400: '#54ab7d',
          500: '#339063',
          600: '#24734f',
          700: '#1d5b40',
          800: '#1a4834',
          900: '#163b2c',
          950: '#0a2118',
        },
      },
      fontFamily: {
        sans: ['Tajawal', 'IBM Plex Sans Arabic', 'system-ui', 'sans-serif'],
        display: ['Amiri', 'Tajawal', 'serif'],
      },
      keyframes: {
        wave: {
          '0%, 100%': { transform: 'scaleY(0.3)' },
          '50%':       { transform: 'scaleY(1)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',     opacity: '1' },
        },
      },
      animation: {
        wave:       'wave 1.2s ease-in-out infinite',
        'fade-in':  'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
      },
    },
  },
  plugins: [],
};
