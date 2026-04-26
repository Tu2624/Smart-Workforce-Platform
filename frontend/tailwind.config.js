/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        'slate-925': '#0a0f1e',
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -4px rgba(6,182,212,0.35)',
        'glow-sm': '0 0 12px -4px rgba(6,182,212,0.25)',
        'glow-blue': '0 0 20px -4px rgba(59,130,246,0.35)',
        'glow-purple': '0 0 20px -4px rgba(139,92,246,0.35)',
        'glass': '0 25px 50px -12px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
}
