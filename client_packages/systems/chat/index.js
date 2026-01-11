// [Client] Sistem de Chat Custom - înlocuiește chat-ul default RAGE:MP
// Rulează în context RAGE:MP Client (NU Node.js, FĂRĂ require/fs)
// Folosește: mp.gui.chat, mp.keys, mp.game.controls, mp.events ('render')

// Stare globală pentru chat input
let chatInputOpen = false;

// Keycode pentru T
const KEY_T = 0x54;

/**
 * Trimite toggle event către UI pentru a deschide/închide input-ul
 * @param {boolean} state - Starea input-ului (true = deschis, false = închis)
 */
function sendToggleToUI(state) {
  try {
    if (typeof global !== "undefined" && global.uiBrowser) {
      const script = `
        window.dispatchEvent(new CustomEvent('chat:toggle', {
          detail: { state: ${state} }
        }));
      `;
      global.uiBrowser.execute(script);
      console.log(`[Chat] Sent chat:toggle event to UI, state: ${state}`);
    } else {
      console.log("[Chat] UI browser not available, skipping toggle");
    }
  } catch (e) {
    console.log("[Chat] Error sending toggle to UI:", e);
  }
}

/**
 * Trimite mesaj către UI pentru afișare
 * @param {string} text - Textul mesajului
 * @param {string} color - Culoarea mesajului (hex, default #ffffff)
 */
function sendMessageToUI(text, color = "#ffffff") {
  try {
    if (typeof global !== "undefined" && global.uiBrowser) {
      // Escape quotes pentru siguranță în JavaScript string
      const safeText = String(text)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/\n/g, "\\n");
      const script = `
        window.dispatchEvent(new CustomEvent('chat:push', {
          detail: { text: '${safeText}', color: '${color}' }
        }));
      `;
      global.uiBrowser.execute(script);
      console.log(`[Chat] Forward push to UI:`, text);
    } else {
      console.log("[Chat] UI browser not available, skipping message push");
    }
  } catch (e) {
    console.log("[Chat] Error sending message to UI:", e);
  }
}

/**
 * Dezactivează chat-ul default RAGE:MP
 * Executat la playerReady
 */
function disableDefaultChat() {
  try {
    // Wiki: GUI::chat.show(show) - arată/ascunde chat-ul
    mp.gui.chat.show(false);
    console.log("[Chat] Default chat hidden");

    // Wiki: GUI::chat.activate(activate) - activează/dezactivează chat-ul
    mp.gui.chat.activate(false);
    console.log("[Chat] Default chat deactivated");

    console.log("[Chat] Default chat disabled");
  } catch (e) {
    console.log("[Chat] Error disabling default chat:", e);
  }
}

/**
 * Event handler pentru keybind T (0x54)
 * Wiki: Keys::isDown - verifică dacă o tastă este apăsată
 */
let lastTKeyPress = 0;
const T_KEY_DEBOUNCE = 200; // 200ms debounce pentru a evita spam

mp.events.add("render", () => {
  // Debounce pentru T key
  const now = Date.now();
  if (now - lastTKeyPress < T_KEY_DEBOUNCE) {
    return;
  }

  // Wiki: Keys::isDown(keyCode) - verifică dacă T este apăsat
  if (mp.keys.isDown(KEY_T)) {
    lastTKeyPress = now;

    // Dacă inputul e închis, deschide-l
    if (!chatInputOpen) {
      console.log("[Chat] T pressed");

      // Trimite event către UI pentru a deschide input-ul
      sendToggleToUI(true);

      // Setează starea locală
      chatInputOpen = true;

      // Arată cursorul: Wiki: GUI::cursor.show(show, locked)
      mp.gui.cursor.show(true, true);
      console.log("[Chat] Cursor shown, controls will be blocked");
    }
  }
});

/**
 * Render loop pentru blocarea controalelor cât timp inputul e deschis
 * Wiki: Events::render - invocat la fiecare frame
 * Wiki: Game::controls.disableAllControlActions - dezactivează toate acțiunile de control
 */
mp.events.add("render", () => {
  // Blochează controalele doar când inputul e deschis
  if (chatInputOpen) {
    try {
      // Wiki: Game::controls.disableAllControlActions - dezactivează toate controalele
      // Parametrul 0 = control type (0 = player controls)
      // Notă: Verifică în wiki dacă această metodă există; dacă nu, adaptează
      if (
        typeof mp.game !== "undefined" &&
        mp.game.controls &&
        typeof mp.game.controls.disableAllControlActions === "function"
      ) {
        mp.game.controls.disableAllControlActions(0);
      } else {
        // Fallback: poate fi disponibilă direct sau prin alt API
        // Log warning dar continuă fără crash
        // console.log('[Chat] Warning: disableAllControlActions not available');
      }
    } catch (e) {
      // Ignoră eroarea pentru a nu opri render loop-ul
      // console.log('[Chat] Error disabling controls:', e);
    }
  }
});

/**
 * Event handler pentru mesaj trimis din UI
 * Primește event prin mp.trigger din CEF
 * IMPORTANT: mp.trigger este disponibil în CEF pentru comunicare UI -> Client
 * În UI React, se folosește: window.mp.trigger('chat:send', text)
 */
mp.events.add("chat:send", (text) => {
  console.log("[Chat] UI send:", text);

  try {
    // Validare text
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      console.log("[Chat] Invalid or empty text, ignoring");
      return;
    }

    const trimmedText = text.trim();

    // Verifică dacă începe cu / (comandă)
    if (trimmedText.startsWith("/")) {
      // Trimite la server ca comandă (fără slash)
      const commandText = trimmedText.substring(1);
      console.log("[Chat] Sending command to server:", commandText);

      // Wiki: Events::callRemote - trimite event către server
      mp.events.callRemote("server:command", commandText);
    } else {
      // Trimite la server ca mesaj chat normal
      console.log("[Chat] Sending chat message to server:", trimmedText);

      // Wiki: Events::callRemote - trimite event către server
      mp.events.callRemote("server:chat", trimmedText);
    }

    // Închide input-ul și ascunde cursorul
    chatInputOpen = false;
    sendToggleToUI(false);

    // Wiki: GUI::cursor.show(show, locked) - ascunde cursorul
    mp.gui.cursor.show(false, false);
    console.log("[Chat] Input closed, cursor hidden");
  } catch (e) {
    console.log("[Chat] Error processing chat:send:", e);
  }
});

/**
 * Event handler pentru cancel din UI (ESC)
 * Primește event prin mp.trigger din CEF
 */
mp.events.add("chat:cancel", () => {
  console.log("[Chat] UI cancel");

  try {
    // Închide input-ul și ascunde cursorul
    chatInputOpen = false;
    sendToggleToUI(false);

    // Wiki: GUI::cursor.show(show, locked) - ascunde cursorul
    mp.gui.cursor.show(false, false);
    console.log("[Chat] Toggle open/close: closed (ESC pressed)");
  } catch (e) {
    console.log("[Chat] Error processing chat:cancel:", e);
  }
});

/**
 * Event handler pentru mesaj primit de la server
 * Wiki: Events::add - ascultă event-uri trimise de server
 * Serverul trimite prin: player.call('chat:push', [text, color])
 */
mp.events.add("chat:push", (text, color) => {
  console.log("[Chat] Received chat:push from server:", { text, color });

  try {
    // Validare
    if (!text || typeof text !== "string") {
      console.log("[Chat] Invalid text from server, ignoring");
      return;
    }

    const messageColor = color || "#ffffff"; // Default alb

    // Forward către UI prin CustomEvent
    sendMessageToUI(text, messageColor);
    console.log("[Chat] Forward push to UI completed");
  } catch (e) {
    console.log("[Chat] Error processing chat:push:", e);
  }
});

/**
 * La playerReady, dezactivează chat-ul default
 * Wiki: Events::add - ascultă event-uri RAGE:MP
 */
mp.events.add("playerReady", () => {
  console.log("[Chat] playerReady event triggered");
  disableDefaultChat();
});

// Dezactivează chat-ul default imediat la încărcare (înainte de playerReady)
disableDefaultChat();

console.log("[Chat] Chat system module loaded");
