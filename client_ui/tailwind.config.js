// [UI] Configurație Tailwind CSS pentru React UI
// Tailwind va procesa toate fișierele din src/ și index.html

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
