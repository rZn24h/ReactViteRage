// [Client] Hacker System - NetRunner / Hacker pentru ATM cu Getaway
// Environment: RAGE:MP Client JS (NU Node.js)
// Funcționalitate: E lângă ATM -> prompt -> game -> animație -> getaway

let isHacking = false;
let radarWasVisible = true;
let animDictLoaded = false;
let getawayTimer = null;
let getawayBlips = [];
let getawayColshapes = [];
let isInGetaway = false;

// Coordonate ATM-uri și magazine de haine pentru getaway
const hackSpots = [
  new mp.Vector3(-104.38, 6477.58, 31.62),
  new mp.Vector3(147.65, -1035.75, 29.34),
];

// Coordonate magazine de haine (GTA V) - 3 locații pentru getaway
const clothingStores = [
  new mp.Vector3(72.25, -1399.10, 29.38),  // Downtown LS
  new mp.Vector3(-708.71, -152.13, 37.42),  // Rockford Hills
  new mp.Vector3(-3172.50, 1048.13, 20.86), // Paleto Bay
];

let atmBlips = [];

function createATMBlips() {
  try {
    atmBlips.forEach(blip => {
      try { blip.destroy(); } catch (_) {}
    });
    atmBlips = [];
    hackSpots.forEach((spot, index) => {
      try {
        const blip = mp.blips.new(277, spot, {
          name: `ATM #${index + 1}`,
          color: 2,
          shortRange: false,
          scale: 0.8,
          dimension: mp.players.local ? mp.players.local.dimension : 0
        });
        atmBlips.push(blip);
      } catch (e) {
        mp.console.logInfo(`[Hacker] Error creating blip #${index + 1}: ${e}`);
      }
    });
    mp.console.logInfo(`[Hacker] Created ${atmBlips.length} ATM blips`);
  } catch (e) {
    mp.console.logInfo(`[Hacker] Error creating ATM blips: ${e}`);
  }
}

function uiDispatch(eventName, detail) {
  try {
    let uiBrowser = null;
    if (typeof global !== "undefined" && global.uiBrowser) {
      uiBrowser = global.uiBrowser;
    } else if (typeof window !== "undefined" && window.uiBrowser) {
      uiBrowser = window.uiBrowser;
    }
    if (!uiBrowser) {
      mp.console.logInfo(`[Hacker] uiDispatch: uiBrowser not available for ${eventName}`);
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
    mp.console.logInfo(`[Hacker] uiDispatch: ${eventName} sent`);
  } catch (e) {
    mp.console.logInfo(`[Hacker] uiDispatch error: ${e}`);
  }
}

function nearSpot(maxDist = 1.5) {
  const p = mp.players.local.position;
  for (const s of hackSpots) {
    const d = mp.game.system.vdist(p.x, p.y, p.z, s.x, s.y, s.z);
    if (d <= maxDist) return true;
  }
  return false;
}

function restoreRadar() {
  try {
    mp.game.ui.displayRadar(radarWasVisible);
  } catch (e) {
    try { mp.game.ui.displayRadar(true); } catch (_) {}
  }
}

// Preload animație
let animationCheckInterval = null;

function loadGrabCashAnimation() {
  if (animDictLoaded) return;
  try {
    // Curăță interval-ul anterior dacă există
    if (animationCheckInterval) {
      clearInterval(animationCheckInterval);
      animationCheckInterval = null;
    }
    
    mp.game.streaming.requestAnimDict("anim@heists@ornate_bank@grab_cash");
    
    // Verifică periodic dacă animația s-a încărcat
    animationCheckInterval = setInterval(() => {
      try {
        if (mp.game.streaming.hasAnimDictLoaded("anim@heists@ornate_bank@grab_cash")) {
          animDictLoaded = true;
          if (animationCheckInterval) {
            clearInterval(animationCheckInterval);
            animationCheckInterval = null;
          }
          mp.console.logInfo("[Hacker] Animation dictionary loaded");
        }
      } catch (e) {
        mp.console.logInfo(`[Hacker] Error checking animation load: ${e}`);
        // Curăță la eroare
        if (animationCheckInterval) {
          clearInterval(animationCheckInterval);
          animationCheckInterval = null;
        }
      }
    }, 100);
    
    // Timeout: curăță după 10 secunde dacă nu s-a încărcat
    setTimeout(() => {
      if (animationCheckInterval) {
        clearInterval(animationCheckInterval);
        animationCheckInterval = null;
        if (!animDictLoaded) {
          mp.console.logInfo("[Hacker] Animation loading timeout after 10s");
        }
      }
    }, 10000);
  } catch (e) {
    mp.console.logInfo(`[Hacker] Error loading animation: ${e}`);
    // Curăță la eroare
    if (animationCheckInterval) {
      clearInterval(animationCheckInterval);
      animationCheckInterval = null;
    }
  }
}

// Animație grab cash când hack-ul reușește
function playGrabCashAnimation(callback) {
  if (!animDictLoaded) {
    mp.console.logInfo("[Hacker] Animation not loaded, skipping");
    // Unfreeze în caz că animația nu e încărcată
    try {
      mp.players.local.freezePosition(false);
      mp.console.logInfo("[Hacker] Player unfrozen (animation not loaded)");
    } catch (e) {}
    if (callback) callback();
    return;
  }
  
  try {
    const player = mp.players.local;
    mp.console.logInfo("[Hacker] Playing grab cash animation");
    
    // Freeze player pentru animație
    try {
      player.freezePosition(true);
      mp.console.logInfo("[Hacker] Player frozen for animation");
    } catch (e) {
      mp.console.logInfo(`[Hacker] Error freezing for animation: ${e}`);
    }
    
    // Task play animation folosind API-ul RAGE:MP
    // Wiki: https://wiki.rage.mp/index.php?title=Player::taskPlayAnim
    // taskPlayAnim(dict, name, speed, speedMultiplier, duration, flag, playbackRate, lockX, lockY, lockZ)
    try {
      player.taskPlayAnim(
        "anim@heists@ornate_bank@grab_cash", // dict
        "grab",                              // name
        2.0,                                 // speed (2x speed = animație mai rapidă)
        -2.0,                                // speedMultiplier
        3000,                                // duration (3 secunde în ms)
        1,                                   // flag (0 = normal, 1 = loop)
        0.0,                                 // playbackRate
        false,                               // lockX
        false,                               // lockY
        false                                // lockZ
      );
      mp.console.logInfo("[Hacker] Animation task started");
    } catch (e) {
      mp.console.logInfo(`[Hacker] Error starting animation task: ${e}`);
    }
    
    // După 3 secunde, unfreeze și callback
    setTimeout(() => {
      try {
        // Stop animația
        try {
          player.clearTasks();
          mp.console.logInfo("[Hacker] Animation stopped");
        } catch (e) {
          mp.console.logInfo(`[Hacker] Error stopping animation: ${e}`);
        }
        
        // Unfreeze player
        player.freezePosition(false);
        mp.console.logInfo("[Hacker] Grab cash animation finished - player unfrozen");
      } catch (e) {
        mp.console.logInfo(`[Hacker] Error unfreezing after animation: ${e}`);
        // Fallback: încearcă din nou
        try {
          mp.players.local.freezePosition(false);
        } catch (e2) {
          mp.console.logInfo(`[Hacker] Fallback unfreeze also failed: ${e2}`);
        }
      }
      if (callback) callback();
    }, 3000); // 3 secunde (3000ms) - maxim 5 secunde cerut
  } catch (e) {
    mp.console.logInfo(`[Hacker] Error playing animation: ${e}`);
    // În caz de eroare, asigură-te că player-ul e unfrozen
    try {
      mp.players.local.freezePosition(false);
      mp.console.logInfo("[Hacker] Player unfrozen (error fallback)");
    } catch (e2) {}
    if (callback) callback();
  }
}

// Cleanup getaway
function cleanupGetaway() {
  if (getawayTimer) {
    clearInterval(getawayTimer);
    getawayTimer = null;
  }
  getawayBlips.forEach(blip => {
    try { blip.destroy(); } catch (_) {}
  });
  getawayBlips = [];
  getawayColshapes.forEach(col => {
    try { col.destroy(); } catch (_) {}
  });
  getawayColshapes = [];
  isInGetaway = false;
  
  try {
    mp.game.gameplay.setFakeWantedLevel(0);
    mp.console.logInfo("[Hacker] Fake wanted level reset");
  } catch (e) {
    mp.console.logInfo(`[Hacker] Error resetting wanted level: ${e}`);
  }
}

// Start getaway system
function startGetaway() {
  if (isInGetaway) {
    mp.console.logInfo("[Hacker] Getaway already active");
    return;
  }
  
  mp.console.logInfo("[Hacker] Starting getaway sequence");
  isInGetaway = true;
  
  // Mesaj alertă
  mp.gui.chat.push("!{#FF0000}[ALARM]!{#FFFFFF} Change clothes at a store within 2 minutes!");
  
  // Fake wanted level
  try {
    mp.game.gameplay.setFakeWantedLevel(2);
    mp.console.logInfo("[Hacker] Fake wanted level set to 2");
  } catch (e) {
    mp.console.logInfo(`[Hacker] Error setting wanted level: ${e}`);
  }
  
  // Creează blips pentru magazine
  clothingStores.forEach((store, index) => {
    try {
      const blip = mp.blips.new(73, store, {
        name: `Clothing Store #${index + 1}`,
        color: 1, // Red
        shortRange: false,
        scale: 1.0,
        dimension: mp.players.local ? mp.players.local.dimension : 0
      });
      getawayBlips.push(blip);
      
      // Creează colshape pentru magazin (radius 3.0m)
      const colshape = mp.colshapes.newSphere(store.x, store.y, store.z, 3.0);
      colshape.storeIndex = index;
      getawayColshapes.push(colshape);
      
      mp.console.logInfo(`[Hacker] Created getaway blip and colshape #${index + 1}`);
    } catch (e) {
      mp.console.logInfo(`[Hacker] Error creating getaway blip/colshape #${index + 1}: ${e}`);
    }
  });
  
  // Timer 2 minute (120 secunde)
  let timeLeft = 120;
  getawayTimer = setInterval(() => {
    timeLeft--;
    
    if (timeLeft <= 0) {
      // Fail - timpul a expirat
      clearInterval(getawayTimer);
      getawayTimer = null;
      mp.gui.chat.push("!{#FF0000}[FAILED]!{#FFFFFF} Police located you. Wanted level active.");
      mp.console.logInfo("[Hacker] Getaway timer expired - player failed");
      
      // Șterge blips dar păstrează wanted level
      getawayBlips.forEach(blip => {
        try { blip.destroy(); } catch (_) {}
      });
      getawayBlips = [];
      getawayColshapes.forEach(col => {
        try { col.destroy(); } catch (_) {}
      });
      getawayColshapes = [];
      isInGetaway = false;
    } else if (timeLeft <= 30) {
      // Warning când mai sunt 30 secunde
      if (timeLeft === 30) {
        mp.gui.chat.push(`!{#FFAA00}[WARNING]!{#FFFFFF} Only 30 seconds left!`);
      }
    }
  }, 1000);
  
  mp.console.logInfo("[Hacker] Getaway timer started (120 seconds)");
}

// Verifică colshapes pentru magazine
mp.events.add("playerEnterColshape", (colshape) => {
  if (!isInGetaway || getawayColshapes.indexOf(colshape) === -1) return;
  
  mp.console.logInfo("[Hacker] Player entered clothing store colshape - getaway success");
  
  // Success - a ajuns la magazin în timp
  cleanupGetaway();
  mp.gui.chat.push("!{#00FF00}[SUCCESS]!{#FFFFFF} Changed clothes. Police lost your trail.");
  
  // Trimite event la server
  mp.events.callRemote("server:hacker:safe");
});

mp.keys.bind(0x45, true, () => {
  if (isHacking || isInGetaway) return;
  if (mp.gui.cursor.visible) return;
  if (nearSpot(1.5)) {
    mp.console.logInfo("[Hacker] E pressed near ATM");
    mp.events.callRemote("server:hacker:requestStart");
  }
});

// Server -> Client: start hack (arată prompt)
mp.events.add("client:hacker:start", () => {
  if (isHacking) {
    mp.console.logInfo("[Hacker] Already hacking, ignoring");
    return;
  }
  mp.console.logInfo("[Hacker] Hack request - showing prompt");
  mp.gui.cursor.show(true, true);
  radarWasVisible = true;
  setTimeout(() => {
    uiDispatch("hacker:start", {});
  }, 100);
});

// UI -> Client: confirm hack (începe jocul)
mp.events.add("hacker:confirm", () => {
  if (isHacking) return;
  mp.console.logInfo("[Hacker] Hack confirmed - starting game");
  isHacking = true;
  
  try {
    mp.game.ui.displayRadar(false);
  } catch (e) {}
  
  try {
    mp.players.local.freezePosition(true);
  } catch (e) {}
  
  uiDispatch("hacker:gameStart", {});
});

// UI -> Client: cancel hack
mp.events.add("hacker:cancel", () => {
  mp.console.logInfo("[Hacker] Hack cancelled");
  mp.gui.cursor.show(false, false);
  uiDispatch("hacker:hide", {});
});

function endHackSession(success, skipUnfreeze = false) {
  if (!isHacking) return;
  isHacking = false;
  
  try {
    mp.gui.cursor.show(false, false);
  } catch (e) {}
  
  restoreRadar();
  
  // Nu unfreeze dacă urmează animația (success case)
  // Animația va face unfreeze singură
  if (!skipUnfreeze) {
    try {
      mp.players.local.freezePosition(false);
      mp.console.logInfo("[Hacker] Player unfrozen (endHackSession)");
    } catch (e) {
      mp.console.logInfo(`[Hacker] Error unfreezing player: ${e}`);
    }
  }
  
  uiDispatch("hacker:hide", {});
}

// UI -> Client: finish hack
mp.events.add("hacker:finish", (raw) => {
  mp.console.logInfo(`[Hacker] hacker:finish received: ${raw}`);
  
  let data = { success: false };
  try {
    data = JSON.parse(String(raw));
  } catch (e) {
    mp.console.logInfo(`[Hacker] Error parsing finish data: ${e}`);
  }
  
  const success = !!data.success;
  
  // Trimite rezultat la server
  mp.events.callRemote("server:hacker:result", success);
  
  // Dacă success, redă animația și declanșează getaway
  // IMPORTANT: Nu închide sesiunea imediat (skipUnfreeze=true) pentru că animația freeze din nou
  if (success) {
    mp.console.logInfo("[Hacker] Hack successful - playing animation and starting getaway");
    
    // Închide sesiunea fără unfreeze (animația va face freeze și apoi unfreeze singură)
    endHackSession(success, true); // skipUnfreeze = true
    
    // Redă animația (freeze + unfreeze)
    playGrabCashAnimation(() => {
      // După animație, start getaway
      startGetaway();
      // Double-check: asigură-te că player-ul e unfrozen
      try {
        mp.players.local.freezePosition(false);
        mp.console.logInfo("[Hacker] Final unfreeze check after animation");
      } catch (e) {
        mp.console.logInfo(`[Hacker] Error in final unfreeze check: ${e}`);
      }
    });
  } else {
    // Fail case - închide sesiunea normal (cu unfreeze)
    endHackSession(success, false); // skipUnfreeze = false
  }
});

mp.events.add("render", () => {
  if (!isHacking) return;
  try {
    mp.game.controls.disableAllControlActions(0);
  } catch (e) {}
});

mp.events.add("playerReady", () => {
  mp.console.logInfo("[Hacker] playerReady");
  
  try {
    mp.game.ui.displayRadar(true);
    radarWasVisible = true;
  } catch (e) {}
  
  // Preload animație
  loadGrabCashAnimation();
  
  setTimeout(() => {
    createATMBlips();
  }, 1000);
});

mp.events.add("playerQuit", () => {
  try {
    if (isHacking) endHackSession(false);
    cleanupGetaway();
    
    // Curăță interval-ul de animație
    if (animationCheckInterval) {
      clearInterval(animationCheckInterval);
      animationCheckInterval = null;
    }
    
    atmBlips.forEach(blip => {
      try { blip.destroy(); } catch (_) {}
    });
    atmBlips = [];
  } catch (e) {
    mp.console.logInfo(`[Hacker] Error on quit: ${e}`);
  }
});

mp.console.logInfo("[Hacker] Hacker system module loaded");
