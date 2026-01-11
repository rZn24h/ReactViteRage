// [Client] Coords Manager - stream live coordonate către UI React
// Rulează în context RAGE:MP Client (NU Node.js, FĂRĂ require/fs)
// Folosește: mp.players.local.position, mp.players.local.getHeading, mp.events ('render')

// Stare globală pentru loc window
let locOpen = false;
let lastUpdateTime = 0;
const UPDATE_INTERVAL = 100; // Update la fiecare 100ms (throttle)

/**
 * Trimite update coordonate către UI React
 * @param {number} x - Coordonata X
 * @param {number} y - Coordonata Y
 * @param {number} z - Coordonata Z
 * @param {number} heading - Heading (orientare) în grade
 */
function sendCoordsToUI(x, y, z, heading) {
  try {
    if (typeof global !== 'undefined' && global.uiBrowser) {
      const script = `
        window.dispatchEvent(new CustomEvent('loc:update', {
          detail: { x: ${x.toFixed(4)}, y: ${y.toFixed(4)}, z: ${z.toFixed(4)}, h: ${heading.toFixed(2)} }
        }));
      `;
      global.uiBrowser.execute(script);
    }
  } catch (e) {
    console.log('[Loc] Error sending coords to UI:', e);
  }
}

/**
 * Trimite toggle event către UI pentru a deschide/închide fereastra
 * @param {boolean} open - Starea fereastrei (true = deschis, false = închis)
 */
function sendToggleToUI(open) {
  try {
    if (typeof global !== 'undefined' && global.uiBrowser) {
      const script = `
        window.dispatchEvent(new CustomEvent('loc:toggle', {
          detail: { open: ${open} }
        }));
      `;
      global.uiBrowser.execute(script);
      console.log(`[Loc] Sent loc:toggle event to UI, open: ${open}`);
    }
  } catch (e) {
    console.log('[Loc] Error sending toggle to UI:', e);
  }
}

/**
 * Setează starea loc window (sursă unică pentru toggle)
 * Gestionează cursorul și trimite event la UI
 * @param {boolean} state - Noua stare (true = deschis, false = închis)
 */
function setLocOpen(state) {
  console.log(`[Loc] setLocOpen called with state: ${state}`);
  
  // Actualizează starea
  locOpen = state;
  
  // Gestionare cursor: afișează cursorul când fereastra este deschisă
  // Wiki: GUI::cursor.show(show, locked) - show cursor și blochează controalele jucătorului
  if (locOpen) {
    mp.gui.cursor.show(true, true); // Afișează cursor și blochează controalele
    mp.gui.chat.push('[Loc] Coords manager opened');
    console.log('[Loc] Cursor shown, controls locked');
  } else {
    mp.gui.cursor.show(false, false); // Ascunde cursor și permite controalele normale
    mp.gui.chat.push('[Loc] Coords manager closed');
    console.log('[Loc] Cursor hidden, controls unlocked');
  }
  
  // Trimite event la UI pentru a deschide/închide fereastra
  sendToggleToUI(locOpen);
}

/**
 * Update loop pentru coordonate live
 * Rulează la fiecare frame când locOpen = true
 * Wiki: Events::render - invocat la fiecare frame
 */
mp.events.add('render', () => {
  // Execută doar dacă fereastra loc este deschisă
  if (!locOpen) {
    return;
  }

  // Throttle: update doar la fiecare UPDATE_INTERVAL ms
  const now = Date.now();
  if (now - lastUpdateTime < UPDATE_INTERVAL) {
    return;
  }
  lastUpdateTime = now;

  try {
    const player = mp.players.local;
    
    // Wiki: Entity::position property - obține poziția jucătorului
    const pos = player.position;
    
    // Wiki: Entity::getHeading - obține heading-ul (orientarea) în grade
    // getHeading() returnează float (unghiul în grade 0-360)
    let heading = 0;
    if (typeof player.getHeading === 'function') {
      heading = player.getHeading();
    } else if (player.heading !== undefined) {
      // Fallback: dacă heading este o proprietate directă
      heading = player.heading;
    } else {
      console.log('[Loc] Warning: Could not get player heading');
      heading = 0;
    }
    
    // Trimite coordonatele la UI
    sendCoordsToUI(pos.x, pos.y, pos.z, heading);
  } catch (e) {
    console.log('[Loc] Error in render loop:', e);
  }
});

/**
 * Event handler pentru toggle loc window de la server
 * Wiki: Events::add - ascultă event-uri trimise de server
 */
mp.events.add('dev:loc:toggle', () => {
  console.log('[Loc] Received dev:loc:toggle event from server');
  
  // Toggle starea folosind funcția centralizată
  setLocOpen(!locOpen);
});

/**
 * Event handler pentru închidere loc window din UI (ESC key)
 * Primit prin mp.trigger('loc:close') din UI React când utilizatorul apasă ESC
 * Acest handler primește direct event-ul de la UI prin mp.trigger
 */
mp.events.add('loc:close', () => {
  console.log('[Loc] Received loc:close event from UI (ESC pressed)');
  console.log('[Loc] UI requested close (ESC)');
  
  // Închide fereastra folosind funcția centralizată
  if (locOpen) {
    setLocOpen(false);
    console.log('[Loc] Cursor hidden, loc window closed');
  } else {
    console.log('[Loc] Window was already closed, ignoring');
  }
});

console.log('[Loc] Loc module loaded');
