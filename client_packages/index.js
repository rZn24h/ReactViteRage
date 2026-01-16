// [Client] Entry point pentru client-side logic
// Acest fișier rulează în contextul RAGE:MP Client (NU Node.js)
// IMPORTANT: NU folosi require, fs, dotenv sau alte module Node.js aici
// Folosește DOAR API-urile RAGE:MP documentate în wiki: mp.browsers, mp.gui, mp.events

// Variabilă globală pentru referința browserului UI
// Păstrăm referința pentru a preveni crearea multiplă a browserului
let uiBrowser = null;

/**
 * Funcție helper pentru inițializarea browserului UI
 * Expune uiBrowser global pentru a fi accesibil din alte module (fly.js, loc.js, chat.js, etc.)
 */
function initializeUIBrowser() {
  if (!uiBrowser) {
    // Creează browserul imediat la încărcarea scriptului
    uiBrowser = mp.browsers.new("package://ui/index.html");

    // NOTĂ: Cursorul este gestionat dinamic per-feature
    // În mod normal, cursorul este ascuns; va fi afișat doar când e necesar (ex: /loc window, chat input)
    mp.gui.cursor.show(false, false);

    // Expune uiBrowser global pentru a fi accesibil din alte module
    // În RAGE:MP client, global object poate fi accesat prin this sau global sau window
    if (typeof global !== "undefined") {
      global.uiBrowser = uiBrowser;
    } else if (typeof window !== "undefined") {
      window.uiBrowser = uiBrowser;
    } else if (typeof this !== "undefined") {
      this.uiBrowser = uiBrowser;
    }

    // Log pentru debugging
    console.log("[Client] UI Browser created on script load.");
    console.log("[Client] UI Browser exposed globally for module access");
  }
}

// Inițializează browserul UI imediat (înainte de playerReady pentru compatibilitate)
initializeUIBrowser();

// Eveniment care se declanșează când clientul este complet inițializat
// Wiki: Events::add - ascultă event-uri RAGE:MP
mp.events.add("playerReady", () => {
  console.log("[Client] playerReady event triggered.");

  // Verifică dacă browserul UI nu a fost deja creat
  if (!uiBrowser) {
    initializeUIBrowser();
  }

  // Ascunde chat-ul default pentru siguranță (chat.js va face acest lucru și el)
  try {
    mp.gui.chat.show(false);
    mp.gui.chat.activate(false);
  } catch (e) {
    console.log("[Client] Error hiding default chat:", e);
  }
});

// Ascunde chat-ul default imediat la încărcare
// Chat-ul custom va fi gestionat de client_packages/systems/chat/index.js
try {
  mp.gui.chat.show(false);
  mp.gui.chat.activate(false);
  console.log("[Client] Default chat hidden on script load");
} catch (e) {
  console.log("[Client] Error hiding default chat:", e);
}

// Încarcă modulele client-side
// În RAGE:MP client, require poate funcționa pentru fișiere locale din același folder
console.log("[Client] Loading client modules...");

try {
  // Admin modules
  require("./admin/fly");
  console.log("[Client] [Fly] Module loaded");
} catch (e) {
  console.log("[Client] [Fly] Failed to load:", e.message);
}

try {
  require("./admin/tpwp");
  console.log("[Client] [TPWP] Module loaded");
} catch (e) {
  console.log("[Client] [TPWP] Failed to load:", e.message);
}

try {
  // Dev modules
  require("./dev/loc");
  console.log("[Client] [Loc] Module loaded");
} catch (e) {
  console.log("[Client] [Loc] Failed to load:", e.message);
}

try {
  // UI Bridge
  require("./ui_bridge");
  console.log("[Client] [UI Bridge] Module loaded");
} catch (e) {
  console.log("[Client] [UI Bridge] Failed to load:", e.message);
}

try {
  // Chat system - custom chat care înlocuiește chat-ul default
  require("./systems/chat");
  console.log("[Client] [Chat] Module loaded");
} catch (e) {
  console.log("[Client] [Chat] Failed to load:", e.message);
}

try {
  // Admin Panel system - dashboard server stats
  require("./systems/adminPanel");
  console.log("[Client] [AdminPanel] Module loaded");
} catch (e) {
  console.log("[Client] [AdminPanel] Failed to load:", e.message);
}

try {
  // Weather/Time system - per-player weather and time controls
  require("./systems/weather");
  console.log("[Client] [Weather] Module loaded");
} catch (e) {
  console.log("[Client] [Weather] Failed to load:", e.message);
}

try {
  // Hacker system - NetRunner / Hacker pentru ATM
  require("./systems/hacker");
  console.log("[Client] [Hacker] Module loaded");
} catch (e) {
  console.log("[Client] [Hacker] Failed to load:", e.message);
}

// Notă: Dacă ai alte module (ex: auth), adaugă-le aici
// try {
//   require('./systems/auth');
//   console.log('[Client] [Auth] Module loaded');
// } catch (e) {
//   console.log('[Client] [Auth] Failed to load:', e.message);
// }

console.log("[Client] All client modules loaded.");
