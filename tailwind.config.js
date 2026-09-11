/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Design tokens — see DESIGN.md for rationale
        base: {
          void: '#080C16',    // page background
          deep: '#0D1526',    // panel background
          surface: '#121C33', // card background
          line: '#1E2B47',    // hairline borders
        },
        signal: {
          cyan: '#2DD4EE',
          blue: '#4C8BF5',
          green: '#3ADE9C',
          amber: '#F5A742',
          red: '#F45B69',
        },
        ink: {
          bright: '#EAF1FB',
          base: '#B7C4DA',
          dim: '#6C7C99',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 24px -6px rgba(45, 212, 238, 0.45)',
        'glow-green': '0 0 20px -4px rgba(58, 222, 156, 0.55)',
        'glow-red': '0 0 20px -4px rgba(244, 91, 105, 0.55)',
      },
      backgroundImage: {
        grid: 'linear-gradient(rgba(45,212,238,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(45,212,238,0.06) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '36px 36px',
      },
      keyframes: {
        pulseRing: {
          '0%': { transform: 'scale(0.8)', opacity: '0.9' },
          '80%': { transform: 'scale(2.2)', opacity: '0' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        blink: {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },
      animation: {
        pulseRing: 'pulseRing 1.8s cubic-bezier(0.2,0.6,0.4,1) infinite',
        blink: 'blink 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
