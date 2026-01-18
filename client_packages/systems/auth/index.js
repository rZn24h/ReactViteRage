// [Client] Sistem de autentificare - Bridge între UI React și Server
// Primește event-uri din UI prin mp.trigger și le forwardează către server
// Rulează în context RAGE:MP Client (NU Node.js, FĂRĂ require/fs)
// Gestionează camera și cursorul pentru ecranul de autentificare

console.log('[Client] [Auth] Module loading...');

// Variabile pentru gestionarea camerei și cursorului
let authCamera = null;
let authModeActive = false;

/**
 * Setează camera cinematică pentru ecranul de autentificare
 * Camera va arăta orașul dintr-o poziție înaltă
 * Wiki: Camera::new - creează o cameră nouă
 * Wiki: Camera::pointAtCoord - face camera să se uite la un punct
 * Wiki: Camera::setActive - activează camera
 * Wiki: Game::cam.renderScriptCams - activează rendering-ul camerelor script
 */
function setupAuthCamera() {
  console.log('[Client] [Auth] Setting up auth camera...');
  
  try {
    // Poziție pentru camera cinematică (mai aproape de sol pentru a încărca texturile)
    // Coordonate: x, y, z (poziție cameră)
    // Z mai mic = mai aproape de sol (texturile se încarcă mai bine)
    // Ajustează coordonatele în funcție de locația dorită în oraș (Los Santos default)
    // Poziție mai aproape de sol pentru a vedea texturile (înălțime ~30-40m deasupra solului)
    const cameraPos = new mp.Vector3(-1355.0, -3047.0, 45.0); // Poziție cameră (mai aproape de sol pentru texturi)
    const lookAtPos = new mp.Vector3(-1355.0, -3047.0, 13.0); // Punctul la care se uită (centru oraș)
    
    // Creează camera: mp.cameras.new(name, position, rotation, fov)
    // rotation: Vector3 cu pitch, yaw, roll (în grade)
    // fov: Field of view (50-60 grade este normal)
    // Pitch negativ = camera se uită în jos (pentru vedere mai bună a texturilor)
    authCamera = mp.cameras.new('default', cameraPos, new mp.Vector3(-20, 0, 0), 50.0);
    
    // Setează camera să se uite la punctul dorit
    authCamera.pointAtCoord(lookAtPos.x, lookAtPos.y, lookAtPos.z);
    
    // Activează camera
    authCamera.setActive(true);
    
    // Activează rendering-ul camerelor script
    // Wiki: Game::cam.renderScriptCams(render, ease, easeTime, p3, p4)
    // render: true pentru a activa rendering-ul
    // ease: false pentru tranziție instantanee
    // easeTime: timpul de tranziție în ms (0 pentru instant)
    // p3, p4: parametri suplimentari (true, false pentru comportament standard)
    mp.game.cam.renderScriptCams(true, false, 0, true, false);
    
    console.log('[Client] [Auth] Auth camera setup complete');
  } catch (error) {
    console.error('[Client] [Auth] Error setting up camera:', error);
  }
}

/**
 * Dezactivează camera cinematică și revine la camera normală
 * Wiki: Camera::setActive - dezactivează camera
 * Wiki: Camera::destroy - distruge camera
 * Wiki: Game::cam.renderScriptCams - dezactivează rendering-ul camerelor script
 */
function destroyAuthCamera() {
  console.log('[Client] [Auth] Destroying auth camera...');
  
  try {
    if (authCamera) {
      // Dezactivează rendering-ul camerelor script înainte de a distruge camera
      mp.game.cam.renderScriptCams(false, false, 0, true, false);
      
      // Dezactivează camera
      authCamera.setActive(false);
      
      // Distruge camera
      authCamera.destroy(true);
      authCamera = null;
      
      console.log('[Client] [Auth] Auth camera destroyed');
    }
  } catch (error) {
    console.error('[Client] [Auth] Error destroying camera:', error);
  }
}

/**
 * Activează modul de autentificare (camera + cursor)
 */
function enableAuthMode() {
  console.log('[Client] [Auth] Enabling auth mode...');
  
  if (authModeActive) {
    console.log('[Client] [Auth] Auth mode already active');
    return;
  }
  
  authModeActive = true;
  
  // Activează camera cinematică
  setupAuthCamera();
  
  // Activează cursorul automat și blochează controalele
  // Wiki: GUI::cursor.show(show, locked) - show cursor și blochează controalele jucătorului
  mp.gui.cursor.show(true, true);
  console.log('[Client] [Auth] Cursor enabled automatically, controls locked');
  
  // Blochează controalele jucătorului în render loop
  mp.events.add('render', disableControlsInAuthMode);
}

/**
 * Dezactivează modul de autentificare (camera + cursor)
 */
function disableAuthMode() {
  console.log('[Client] [Auth] Disabling auth mode...');
  
  if (!authModeActive) {
    console.log('[Client] [Auth] Auth mode not active');
    return;
  }
  
  authModeActive = false;
  
  // Dezactivează camera cinematică
  destroyAuthCamera();
  
  // Dezactivează cursorul automat și permite controalele
  mp.gui.cursor.show(false, false);
  console.log('[Client] [Auth] Cursor disabled automatically, controls unlocked');
  
  // Elimină render loop pentru blocarea controalelor
  mp.events.remove('render', disableControlsInAuthMode);
  
  // Asigură-te că player-ul nu este frozen după autentificare
  try {
    const player = mp.players.local;
    if (player) {
      // Wiki: Entity::freezePosition - dezîngheță poziția jucătorului
      player.freezePosition(false);
      console.log('[Client] [Auth] Player unfrozen after authentication');
    }
  } catch (error) {
    console.error('[Client] [Auth] Error unfreezing player:', error);
  }
}

/**
 * Render loop pentru blocarea controalelor în modul de autentificare
 * Wiki: Events::render - invocat la fiecare frame
 */
function disableControlsInAuthMode() {
  if (!authModeActive) {
    return;
  }
  
  try {
    // Wiki: Game::controls.disableAllControlActions - dezactivează toate controalele
    if (
      typeof mp.game !== 'undefined' &&
      mp.game.controls &&
      typeof mp.game.controls.disableAllControlActions === 'function'
    ) {
      mp.game.controls.disableAllControlActions(0);
    }
  } catch (e) {
    // Ignoră eroarea pentru a nu opri render loop-ul
  }
}

/**
 * Event handler pentru auth:ui:opened
 * Primește event când UI-ul de autentificare se deschide
 * Activează camera și cursorul
 */
mp.events.add('auth:ui:opened', () => {
  console.log('[Client] [Auth] Auth UI opened event received');
  enableAuthMode();
});

/**
 * Event handler pentru auth:ui:closed
 * Primește event când UI-ul de autentificare se închide
 * Dezactivează camera și cursorul
 */
mp.events.add('auth:ui:closed', () => {
  console.log('[Client] [Auth] Auth UI closed event received');
  disableAuthMode();
});

/**
 * Event handler pentru auth:success:client
 * Primește event când autentificarea reușește (din UI)
 * Dezactivează camera și cursorul
 */
mp.events.add('auth:success:client', () => {
  console.log('[Client] [Auth] Auth success event received from UI');
  disableAuthMode();
});

/**
 * Event handler pentru auth:submit
 * Primește JSON-ul din React UI prin mp.trigger
 * Validare și trimite la server prin callRemote
 * 
 * IMPORTANT: mp.trigger este disponibil în CEF pentru comunicare UI -> Client
 * În UI React, se folosește: window.mp.trigger('auth:submit', payload)
 */
mp.events.add('auth:submit', (payload) => {
  console.log('[Client] [Auth] Received auth:submit event from UI');
  
  // Validare payload
  if (!payload || typeof payload !== 'string') {
    console.log('[Client] [Auth] Invalid payload type:', typeof payload);
    sendErrorToUI('Eroare: Date invalide');
    return;
  }
  
  let authData;
  try {
    authData = JSON.parse(payload);
    console.log('[Client] [Auth] Parsed auth data:', { type: authData.type, username: authData.username });
  } catch (error) {
    console.log('[Client] [Auth] Failed to parse JSON:', error);
    sendErrorToUI('Eroare: Format date invalid');
    return;
  }
  
  // Validare structură
  if (!authData.type || !authData.username || !authData.password) {
    console.log('[Client] [Auth] Missing required fields');
    sendErrorToUI('Eroare: Date incomplete');
    return;
  }
  
  if (authData.type !== 'login' && authData.type !== 'register') {
    console.log('[Client] [Auth] Invalid auth type:', authData.type);
    sendErrorToUI('Eroare: Tip autentificare invalid');
    return;
  }
  
  // Pentru register, verifică email
  if (authData.type === 'register' && !authData.email) {
    console.log('[Client] [Auth] Missing email for register');
    sendErrorToUI('Eroare: Email lipsă pentru înregistrare');
    return;
  }
  
  // Trimite la server
  // Wiki: Events::callRemote - trimite event către server
  console.log('[Client] [Auth] Forwarding auth request to server:', authData.type);
  mp.events.callRemote('server:auth:request', authData.type, authData.username, authData.password, authData.email || '');
});

/**
 * Event handler pentru auth:response de la server
 * Primește răspunsul de la server (success sau error)
 * Trimite înapoi la React UI prin browser.execute
 */
mp.events.add('auth:response', (success, message) => {
  console.log('[Client] [Auth] Received auth:response from server:', { success, message });
  
  // Obține referința la browserul UI
  // uiBrowser este expus global în client_packages/index.js
  const browser = global.uiBrowser || window.uiBrowser || this.uiBrowser;
  
  if (!browser) {
    console.log('[Client] [Auth] UI Browser not found, cannot send response to UI');
    return;
  }
  
  if (success) {
    // Autentificare reușită
    console.log('[Client] [Auth] Authentication successful, sending success event to UI');
    
    // Dezactivează modul de autentificare (camera și cursorul)
    disableAuthMode();
    
    browser.execute(`
      (function() {
        const event = new CustomEvent('auth:success', { detail: { message: '${message || 'Autentificare reușită'}' } });
        window.dispatchEvent(event);
      })();
    `);
  } else {
    // Eroare la autentificare
    console.log('[Client] [Auth] Authentication failed, sending error event to UI');
    sendErrorToUI(message || 'Eroare la autentificare');
  }
});

/**
 * Helper funcție pentru trimiterea erorilor către UI
 * @param {string} message - Mesajul de eroare
 */
function sendErrorToUI(message) {
  console.log('[Client] [Auth] Sending error to UI:', message);
  
  const browser = global.uiBrowser || window.uiBrowser || this.uiBrowser;
  
  if (!browser) {
    console.log('[Client] [Auth] UI Browser not found, cannot send error to UI');
    return;
  }
  
  // Escapare mesaj pentru siguranță în JavaScript
  const escapedMessage = message.replace(/'/g, "\\'").replace(/\n/g, "\\n");
  
  browser.execute(`
    (function() {
      const event = new CustomEvent('auth:error', { detail: { message: '${escapedMessage}' } });
      window.dispatchEvent(event);
    })();
  `);
}

console.log('[Client] [Auth] Module loaded successfully');
