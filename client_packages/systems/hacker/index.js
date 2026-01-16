// [Client] Hacker System - NetRunner / Hacker pentru ATM
// Environment: RAGE:MP Client JS (NU Node.js)
// Funcționalitate: E lângă ATM -> start hack -> freeze player -> UI minigame -> reward/fail

let isHacking = false;
let radarWasVisible = true; // Stare originală a radar-ului

// Coordonate ATM-uri pe hartă (GTA V)
// Vector3(x, y, z) pentru fiecare locație ATM
const hackSpots = [
  // Paleto Bay - nord
  new mp.Vector3(-104.38, 6477.58, 31.62),
  
  // Los Santos - centru/downtown
  new mp.Vector3(147.65, -1035.75, 29.34),
  new mp.Vector3(33.17, -1347.81, 29.50),
  new mp.Vector3(-254.42, -692.49, 33.62),
  new mp.Vector3(-1315.71, -834.69, 16.96),
  new mp.Vector3(-1112.25, 2708.52, 18.55),
  
  // Maze Bank Tower
  new mp.Vector3(-301.66, -829.75, 32.42),
  new mp.Vector3(-350.80, -49.56, 49.04),
  
  // Vinewood
  new mp.Vector3(228.18, 338.40, 105.56),
  new mp.Vector3(158.77, 234.22, 106.63),
  
  // Grove Street / South LS
  new mp.Vector3(285.68, 143.37, 104.17),
  new mp.Vector3(-57.17, -92.96, 57.88),
  
  // Pillbox Hill
  new mp.Vector3(-867.13, -187.99, 37.84),
  new mp.Vector3(-821.63, -1081.91, 11.13),
  
  // Rockford Hills
  new mp.Vector3(-717.61, -915.64, 19.22),
  new mp.Vector3(-526.65, -1222.98, 18.45),
  
  // Vespucci Beach
  new mp.Vector3(-1305.35, -706.41, 25.35),
  new mp.Vector3(-2072.41, -317.27, 13.32),
  
  // La Mesa / Industrial
  new mp.Vector3(1175.74, 2706.80, 38.09),
  new mp.Vector3(1077.70, -776.46, 58.24),
  
  // Sandy Shores
  new mp.Vector3(1968.13, 3743.73, 32.34),
  new mp.Vector3(1701.21, 4933.59, 42.06),
  new mp.Vector3(1822.61, 3683.03, 34.28),
  
  // Grapeseed
  new mp.Vector3(1686.75, 4815.74, 42.01),
  
  // Grand Senora Desert
  new mp.Vector3(-95.55, 6457.19, 31.47),
  new mp.Vector3(2682.94, 3286.52, 55.24),
  
  // Airport
  new mp.Vector3(-866.65, -238.74, 40.00),
  new mp.Vector3(214.01, -808.44, 30.73),
  
  // Legion Square
  new mp.Vector3(145.38, -1035.20, 29.37),
  
  // Mirror Park
  new mp.Vector3(129.21, -1291.06, 29.23),
  
  // Little Seoul
  new mp.Vector3(-720.60, -415.66, 34.98),
  
  // Mission Row
  new mp.Vector3(255.85, -225.70, 54.08),
];

// Blips pentru ATM-uri pe hartă
let atmBlips = [];

/**
 * Creează blips pentru toate ATM-urile pe hartă
 */
function createATMBlips() {
  try {
    // Șterge blips existente dacă există (cleanup)
    atmBlips.forEach(blip => {
      try { 
        blip.destroy(); 
      } catch (e) {
        mp.console.logInfo(`[Hacker] Error destroying old blip: ${e}`);
      }
    });
    atmBlips = [];

    // Creează blip pentru fiecare ATM
    hackSpots.forEach((spot, index) => {
      try {
        // Sprite 277 = Dollar Sign (potrivit pentru ATM)
        // Alternativ: 500 = Location marker generic
        const blip = mp.blips.new(277, spot, {
          name: `ATM #${index + 1}`,
          color: 2, // Verde (green)
          shortRange: false, // Apare pe hartă întotdeauna
          scale: 0.8,
          dimension: mp.players.local ? mp.players.local.dimension : 0
        });
        atmBlips.push(blip);
        mp.console.logInfo(`[Hacker] Created ATM blip #${index + 1} at ${spot.x.toFixed(2)}, ${spot.y.toFixed(2)}, ${spot.z.toFixed(2)}`);
      } catch (e) {
        mp.console.logInfo(`[Hacker] Error creating blip #${index + 1}: ${e}`);
      }
    });

    mp.console.logInfo(`[Hacker] Created ${atmBlips.length} ATM blips on map`);
  } catch (e) {
    mp.console.logInfo(`[Hacker] Error creating ATM blips: ${e}`);
  }
}

/**
 * Trimite CustomEvent către UI (React) prin browser.execute
 * @param {string} eventName - Numele event-ului (ex: 'hacker:start')
 * @param {any} detail - Payload-ul event-ului
 */
function uiDispatch(eventName, detail) {
  try {
    // Verifică dacă uiBrowser există (încercă mai multe variante)
    let uiBrowser = null;
    if (typeof global !== "undefined" && global.uiBrowser) {
      uiBrowser = global.uiBrowser;
    } else if (typeof window !== "undefined" && window.uiBrowser) {
      uiBrowser = window.uiBrowser;
    }
    
    if (!uiBrowser) {
      mp.console.logInfo(`[Hacker] uiDispatch: uiBrowser not available for ${eventName}`);
      mp.gui.chat.push(`[Hacker] Error: UI Browser not available`);
      return;
    }
    
    const payload = JSON.stringify(detail ?? {});
    const script = `
      (function() {
        try {
          window.dispatchEvent(new CustomEvent(${JSON.stringify(eventName)}, { detail: ${payload} }));
          console.log('[UI] Event dispatched: ${eventName}', ${payload});
        } catch (e) {
          console.error('[UI] Error dispatching event ${eventName}:', e);
        }
      })();
    `;
    
    uiBrowser.execute(script);
    mp.console.logInfo(`[Hacker] uiDispatch: ${eventName} sent to UI with payload: ${payload}`);
  } catch (e) {
    mp.console.logInfo(`[Hacker] uiDispatch error for ${eventName}: ${e}`);
    mp.gui.chat.push(`[Hacker] Error dispatching ${eventName}: ${e}`);
  }
}

/**
 * Verifică dacă jucătorul e lângă un spot de hack
 * @param {number} maxDist - Distanța maximă (default 1.5)
 * @returns {boolean}
 */
function nearSpot(maxDist = 1.5) {
  const p = mp.players.local.position;
  for (const s of hackSpots) {
    const d = mp.game.system.vdist(p.x, p.y, p.z, s.x, s.y, s.z);
    if (d <= maxDist) return true;
  }
  return false;
}

// E key (0x45) lângă ATM -> cere start de la server
mp.keys.bind(0x45, true, () => {
  if (isHacking) {
    mp.console.logInfo("[Hacker] Already hacking, ignoring E key");
    return;
  }
  if (mp.gui.cursor.visible) {
    mp.console.logInfo("[Hacker] Cursor visible, ignoring E key");
    return;
  }

  if (nearSpot(1.5)) {
    mp.console.logInfo("[Hacker] E pressed near ATM, requesting start from server");
    mp.events.callRemote("server:hacker:requestStart");
  }
});

// Funcție helper pentru a restaura radar-ul
function restoreRadar() {
  try {
    mp.game.ui.displayRadar(radarWasVisible);
    mp.console.logInfo(`[Hacker] Radar restored to ${radarWasVisible ? 'visible' : 'hidden'}`);
  } catch (e) {
    mp.console.logInfo(`[Hacker] Error restoring radar: ${e}`);
    // Fallback: încearcă să arate radar-ul oricum
    try {
      mp.game.ui.displayRadar(true);
      mp.console.logInfo("[Hacker] Radar force-shown as fallback");
    } catch (e2) {
      mp.console.logInfo(`[Hacker] Error force-showing radar: ${e2}`);
    }
  }
}

// Server -> Client: start hack
mp.events.add("client:hacker:start", () => {
  if (isHacking) {
    mp.console.logInfo("[Hacker] Already hacking, ignoring start event");
    return;
  }
  
  mp.console.logInfo("[Hacker] Starting hack session");
  mp.gui.chat.push("[Hacker] Starting hack session...");
  isHacking = true;

  // Salvează starea radar-ului înainte să-l ascundem
  try {
    // Notă: RAGE:MP nu are API direct pentru a verifica starea radar-ului
    // Presupunem că este vizibil în mod normal
    radarWasVisible = true;
  } catch (e) {
    radarWasVisible = true; // Fallback
  }

  // Arată cursor și ascunde radar
  mp.gui.cursor.show(true, true);
  try { 
    mp.game.ui.displayRadar(false); 
    mp.console.logInfo("[Hacker] Radar hidden");
  } catch (e) {
    mp.console.logInfo(`[Hacker] Error hiding radar: ${e}`);
  }
  
  // Freeze player
  try { 
    mp.players.local.freezePosition(true); 
    mp.console.logInfo("[Hacker] Player frozen");
  } catch (e) {
    mp.console.logInfo(`[Hacker] Error freezing player: ${e}`);
  }

  // Delay mic pentru a se asigura că totul e pregătit înainte de UI
  setTimeout(() => {
    // Trimite event către UI
    mp.console.logInfo("[Hacker] Dispatching hacker:start to UI...");
    uiDispatch("hacker:start", {});
    
    // Test: verifică dacă event-ul a ajuns (pentru debugging)
    setTimeout(() => {
      if (isHacking) {
        mp.console.logInfo("[Hacker] Hack session active - UI should be visible");
      }
    }, 500);
  }, 100);
});

// Funcție helper pentru a închide sesiunea de hacking (cleanup complet)
function endHackSession(success) {
  if (!isHacking) return; // Dacă nu e activ, nu face nimic
  
  mp.console.logInfo(`[Hacker] Ending hack session (success: ${success})`);
  isHacking = false;

  // Ascunde cursor
  try {
    mp.gui.cursor.show(false, false);
    mp.console.logInfo("[Hacker] Cursor hidden");
  } catch (e) {
    mp.console.logInfo(`[Hacker] Error hiding cursor: ${e}`);
  }
  
  // Restaurează radar-ul
  restoreRadar();
  
  // Unfreeze player
  try { 
    mp.players.local.freezePosition(false); 
    mp.console.logInfo("[Hacker] Player unfrozen");
  } catch (e) {
    mp.console.logInfo(`[Hacker] Error unfreezing player: ${e}`);
  }

  // Trimite hide event către UI
  uiDispatch("hacker:hide", {});
}

// UI -> Client: finish hack (prin mp.trigger)
mp.events.add("hacker:finish", (raw) => {
  mp.console.logInfo(`[Hacker] hacker:finish received: ${raw}`);
  
  let data = { success: false };
  try { 
    data = JSON.parse(String(raw)); 
    mp.console.logInfo(`[Hacker] Parsed finish data:`, data);
  } catch (e) {
    mp.console.logInfo(`[Hacker] Error parsing finish data: ${e}`);
  }

  // Închide sesiunea
  endHackSession(data.success);
  
  // Trimite rezultat către server
  mp.events.callRemote("server:hacker:result", !!data.success);
  mp.console.logInfo(`[Hacker] Sent result to server: ${!!data.success}`);
});

// Disable controls while hacking
mp.events.add("render", () => {
  if (!isHacking) return;
  try { 
    mp.game.controls.disableAllControlActions(0); 
  } catch (e) {
    // Silent fail
  }
});

// Creează blips când player e ready
mp.events.add("playerReady", () => {
  mp.console.logInfo("[Hacker] playerReady - creating ATM blips");
  
  // Restaurează radar-ul la conectare (în caz că a rămas ascuns)
  try {
    mp.game.ui.displayRadar(true);
    radarWasVisible = true;
    mp.console.logInfo("[Hacker] Radar ensured visible on playerReady");
  } catch (e) {
    mp.console.logInfo(`[Hacker] Error ensuring radar visible: ${e}`);
  }
  
  // Delay mic pentru a se asigura că totul e inițializat
  setTimeout(() => {
    createATMBlips();
  }, 1000);
});

// Cleanup când player se deconectează (opțional, dar good practice)
mp.events.add("playerQuit", () => {
  try {
    // Restaurează radar-ul înainte de quit
    if (isHacking) {
      endHackSession(false);
    }
    
    // Cleanup blips
    atmBlips.forEach(blip => {
      try { blip.destroy(); } catch (_) {}
    });
    atmBlips = [];
    mp.console.logInfo("[Hacker] Cleaned up ATM blips on quit");
  } catch (e) {
    mp.console.logInfo(`[Hacker] Error cleaning up on quit: ${e}`);
  }
});

mp.console.logInfo("[Hacker] Hacker system module loaded");
