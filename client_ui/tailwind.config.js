// [UI] Configurație Tailwind CSS pentru React UI
// Tailwind va procesa toate fișierele din src/ și index.html

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bhood-green': '#009e48',
        'bhood-light': '#00c458',
        'glass-bg': 'rgba(10, 20, 15, 0.6)',
      },
    },
  },
  plugins: [],
}
