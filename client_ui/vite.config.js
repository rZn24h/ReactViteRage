// [UI] Configurație Vite pentru build-ul React UI în RAGE:MP CEF
// Acest fișier configurează Vite astfel încât build-ul să fie generat în client_packages/ui/
// Base: './' este obligatoriu pentru path-uri relative în CEF (package:// protocol)

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Exportă configurația Vite
export default defineConfig({
  // Setează baza pentru path-uri relative în CEF
  // './' asigură că toate asset-urile sunt relative, necesar pentru package:// protocol
  base: "./",

  // Configurație pentru build
  build: {
    // Directorul de output pentru build - trebuie să fie în client_packages/ui/
    // RAGE:MP va încărca fișierele din acest folder folosind package://ui/index.html
    outDir: "../client_packages/ui",

    // Curăță folderul de output înainte de fiecare build
    // Previne acumularea de fișiere vechi
    // IMPORTANT: Setează false DOAR dacă ai fișiere statice custom în ui/ (nu e recomandat)
    // Recomandare: pune fișierele statice în client_ui/public/ sau client_ui/src/assets/
    emptyOutDir: true,
  },

  // Pluginuri Vite
  plugins: [
    // Plugin React pentru suport JSX și HMR
    react(),
  ],
});
