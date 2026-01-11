// [Client] Admin Panel System - Bridge Server -> UI + Heartbeat
// Environment: RAGE:MP Client JS (NU Node.js)
// Funcționalitate: Primește evenimente server și face bridge spre UI + heartbeat pentru ping

let dashboardOpen = false;
let lastPingSentAt = 0;
let lastPongAt = 0;
let lastPingMs = null;

/**
 * Trimite CustomEvent către UI (React) prin browser.execute
 * @param {string} eventName - Numele event-ului (ex: 'ui:dashboard:toggle')
 * @param {any} detail - Payload-ul event-ului
 */
function uiDispatch(eventName, detail) {
  try {
    if (!global.uiBrowser) {
      console.log(`[AdminPanel] uiDispatch: uiBrowser not available for ${eventName}`);
      return;
    }
    
    const payload = JSON.stringify(detail ?? {});
    const script = `
      window.dispatchEvent(new CustomEvent(${JSON.stringify(eventName)}, { detail: ${payload} }));
    `;
    
    global.uiBrowser.execute(script);
    console.log(`[AdminPanel] uiDispatch: ${eventName}`, detail);
  } catch (e) {
    console.log(`[AdminPanel] uiDispatch error for ${eventName}:`, e);
  }
}

// Server -> Client: toggle dashboard
// Wiki: Events::add - ascultă event-uri trimise de server prin player.call
mp.events.add("dashboard:toggle", (state) => {
  dashboardOpen = !!state;
  console.log("[AdminPanel] dashboard:toggle ->", dashboardOpen);

  // Arată/ascunde cursorul
  // Wiki: GUI::cursor.show(show, locked) - arată/ascunde cursorul
  mp.gui.cursor.show(dashboardOpen, dashboardOpen);

  // Trimite event către UI
  uiDispatch("ui:dashboard:toggle", { state: dashboardOpen });
});

// Server -> Client: update payload
// Wiki: Events::add - ascultă event-uri trimise de server prin player.call
mp.events.add("dashboard:update", (payload) => {
  console.log("[AdminPanel] dashboard:update received", payload);
  uiDispatch("ui:dashboard:update", payload || {});
});

// UI (CEF) -> Client: pong response la ping
// Wiki: Events::add - ascultă event-uri trimise din CEF prin window.mp.trigger
mp.events.add("dashboard:pong", (t) => {
  try {
    const sent = Number(t) || 0;
    const ms = Math.max(0, Date.now() - sent);
    lastPingMs = ms;
    lastPongAt = Date.now();

    console.log(`[AdminPanel] dashboard:pong received, ping: ${ms}ms`);
    uiDispatch("ui:dashboard:pong", { ping: ms, ok: true });
  } catch (e) {
    console.log("[AdminPanel] dashboard:pong error:", e);
  }
});

// UI (CEF) -> Client: close dashboard
// Wiki: Events::add - ascultă event-uri trimise din CEF prin window.mp.trigger
mp.events.add("dashboard:close", () => {
  console.log("[AdminPanel] dashboard:close from UI");
  
  dashboardOpen = false;
  
  // Ascunde cursorul
  // Wiki: GUI::cursor.show(show, locked) - ascunde cursorul
  mp.gui.cursor.show(false, false);
  
  // Trimite toggle false către UI
  uiDispatch("ui:dashboard:toggle", { state: false });
});

// Heartbeat loop (5s) - trimite ping către UI
// Dacă UI nu răspunde în 10s, trimite pong cu ok:false
setInterval(() => {
  if (!dashboardOpen) return;

  lastPingSentAt = Date.now();
  uiDispatch("ui:dashboard:ping", { t: lastPingSentAt });

  // Watchdog: dacă nu primim pong în 10s
  setTimeout(() => {
    if (!dashboardOpen) return;
    const now = Date.now();
    const ok = (now - lastPongAt) < 10000; // 10s timeout
    
    if (!ok) {
      console.log("[AdminPanel] Heartbeat timeout - UI not responding");
      uiDispatch("ui:dashboard:pong", { ping: null, ok: false });
    }
  }, 10000);
}, 5000);

console.log("[AdminPanel] Admin Panel system module loaded");
