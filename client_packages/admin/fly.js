// [Client] Noclip movement system - fly mode cu controale WASD + SPACE/CTRL
// Rulează în context RAGE:MP Client (NU Node.js, FĂRĂ require/fs)
// Folosește: mp.keys.isDown, mp.players.local, mp.cameras, mp.events ('render')

// Stare globală pentru fly mode
let flyActive = false;
let flySpeed = 1.0; // Multiplier de viteză (1.0x base, 3.0x cu boost)

// Render loop management - un singur handler cu guard
let renderHandlerAttached = false;

// Viteza de bază pentru mișcare
const BASE_SPEED = 0.35;
const BOOST_MULTIPLIER = 3.0;

// Keycodes (hexadecimal)
const KEY_W = 0x57;
const KEY_A = 0x41;
const KEY_S = 0x53;
const KEY_D = 0x44;
const KEY_SPACE = 0x20;
const KEY_LCTRL = 0x11;
const KEY_LSHIFT = 0x10;

// Referințe pentru a restabili starea normală
let originalAlpha = 255;
let originalInvincible = false;
let originalCollision = true;

/**
 * Normalizează un vector 3D (calculează lungimea și scalează la 1)
 * @param {mp.Vector3} vec - Vector de normalizat
 * @returns {mp.Vector3} - Vector normalizat
 */
function normalizeVector(vec) {
  const length = Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z);
  if (length < 0.0001) {
    return new mp.Vector3(0, 0, 0); // Vector zero
  }
  return new mp.Vector3(vec.x / length, vec.y / length, vec.z / length);
}

/**
 * Obține direcția forward din camera gameplay
 * Wiki: Camera::getDirection - returnează Vector3 forward
 * @returns {mp.Vector3} - Direcția forward normalizată
 */
function getCameraForward() {
  try {
    // Creează o referință la camera gameplay (dacă nu există deja, o creează)
    // Wiki: Camera::new - creează o nouă cameră
    const cam = mp.cameras.new('gameplay');
    
    // Wiki: Camera::getDirection - obține direcția forward
    const dir = cam.getDirection();
    
    // Normalizează direcția
    return normalizeVector(dir);
  } catch (e) {
    console.log('[Fly] Error getting camera direction:', e);
    // Fallback: direcție forward default (0, 1, 0)
    return new mp.Vector3(0, 1, 0);
  }
}

/**
 * Calculează vectorul right (dreapta) din forward și up
 * Right = cross product între forward și up (0, 0, 1)
 * @param {mp.Vector3} forward - Direcția forward
 * @returns {mp.Vector3} - Vector right normalizat
 */
function getRightVector(forward) {
  // Cross product: forward x up(0,0,1) = (-forward.y, forward.x, 0)
  const right = new mp.Vector3(-forward.y, forward.x, 0);
  return normalizeVector(right);
}

/**
 * Trimite update la UI pentru a afișa starea fly mode
 * @param {boolean} active - Starea fly mode (on/off)
 * @param {number} speed - Multiplier de viteză (1.0x sau 3.0x)
 */
function updateUI(active, speed) {
  try {
    // Verifică dacă browserul UI există (expus global în index.js)
    if (typeof global !== 'undefined' && global.uiBrowser) {
      const speedText = speed.toFixed(1);
      const script = `
        window.dispatchEvent(new CustomEvent('fly:update', {
          detail: { active: ${active}, speed: ${speedText} }
        }));
      `;
      global.uiBrowser.execute(script);
      console.log(`[Fly] UI updated: active=${active}, speed=${speedText}x`);
    } else {
      console.log('[Fly] UI browser not available, skipping UI update');
    }
  } catch (e) {
    console.log('[Fly] Error updating UI:', e);
  }
}

/**
 * Activează fly mode: freeze player, invincible, invizibil
 */
function enableFly() {
  console.log('[Fly] Start noclip');
  
  // Verifică dacă nu e deja activ (prevent double enable)
  if (flyActive) {
    console.log('[Fly] Already active, skipping enable');
    return;
  }
  
  try {
    const player = mp.players.local;
    
    // Salvează starea originală pentru restabilire
    // Wiki: Entity::getAlpha - obține alpha (transparență)
    if (typeof player.getAlpha === 'function') {
      originalAlpha = player.getAlpha();
    } else {
      originalAlpha = 255; // Default vizibil
    }
    
    // Wiki: Entity::getInvincible sau Player::getInvincible
    if (typeof player.getInvincible === 'function') {
      originalInvincible = player.getInvincible();
    } else {
      originalInvincible = false;
    }
    
    // Wiki: Entity::getCollision - verifică dacă există
    if (typeof player.getCollision === 'function') {
      originalCollision = player.getCollision();
    } else {
      originalCollision = true;
    }
    
    // Wiki: Entity::freezePosition - îngheță poziția jucătorului
    player.freezePosition(true);
    console.log('[Fly] Player position frozen');
    
    // Wiki: Player::setInvincible sau Entity::setInvincible - face jucătorul invincibil
    if (typeof player.setInvincible === 'function') {
      player.setInvincible(true);
      console.log('[Fly] Player set to invincible');
    }
    
    // Wiki: Entity::setCollision - dezactivează coliziunea
    // Parametrii: (collisionBetweenEntities, collisionWithObjects)
    if (typeof player.setCollision === 'function') {
      player.setCollision(false, false);
      console.log('[Fly] Player collision disabled');
    }
    
    // Wiki: Entity::setAlpha - setează transparența (0 = invizibil, 255 = vizibil)
    if (typeof player.setAlpha === 'function') {
      player.setAlpha(0);
      console.log('[Fly] Player set to invisible (alpha=0)');
    }
    
    // Activează fly mode (render handler va rula din cauza guard-ului)
    flyActive = true;
    flySpeed = 1.0;
    
    // Update UI
    updateUI(true, flySpeed);
    
    console.log('[Fly] Fly mode enabled successfully');
    mp.gui.chat.push('[Fly] Fly mode: ON');
  } catch (e) {
    console.log('[Fly] Error enabling fly mode:', e);
    mp.gui.chat.push('[Fly] Error enabling fly mode');
  }
}

/**
 * Dezactivează fly mode: restore player state normal
 */
function disableFly() {
  console.log('[Fly] Stop noclip');
  
  // Verifică dacă nu e deja dezactivat
  if (!flyActive) {
    console.log('[Fly] Already inactive, skipping disable');
    return;
  }
  
  // Dezactivează fly mode imediat (render handler se va opri din cauza guard-ului)
  flyActive = false;
  flySpeed = 1.0;
  
  try {
    const player = mp.players.local;
    
    // Wiki: Entity::freezePosition - dezîngheță poziția
    player.freezePosition(false);
    console.log('[Fly] Player position unfrozen');
    
    // Restaurează invincibility
    if (typeof player.setInvincible === 'function') {
      player.setInvincible(originalInvincible);
      console.log(`[Fly] Player invincibility restored to ${originalInvincible}`);
    }
    
    // Restaurează collision
    if (typeof player.setCollision === 'function') {
      // setCollision poate primi 2 parametri boolean
      player.setCollision(originalCollision, originalCollision);
      console.log(`[Fly] Player collision restored to ${originalCollision}`);
    }
    
    // Restaurează alpha (vizibilitate)
    if (typeof player.setAlpha === 'function') {
      player.setAlpha(originalAlpha);
      console.log(`[Fly] Player alpha restored to ${originalAlpha}`);
    }
    
    // Update UI
    updateUI(false, 1.0);
    
    console.log('[Fly] Restore player state done');
    mp.gui.chat.push('[Fly] Fly mode: OFF');
  } catch (e) {
    console.log('[Fly] Error disabling fly mode:', e);
    mp.gui.chat.push('[Fly] Error disabling fly mode');
  }
}

/**
 * Calculează vectorul de mișcare pe baza input-ului WASD + SPACE/CTRL
 * @returns {mp.Vector3} - Vector de mișcare normalizat
 */
function calculateMoveVector() {
  const moveVec = new mp.Vector3(0, 0, 0);
  
  // Obține direcția forward și right din camera
  const forward = getCameraForward();
  const right = getRightVector(forward);
  
  // Wiki: Keys::isDown - verifică dacă o tastă este apăsată
  // Keycodes: W=0x57, A=0x41, S=0x53, D=0x44
  // Forward/Backward (W/S)
  if (mp.keys.isDown(KEY_W)) {
    moveVec.x += forward.x;
    moveVec.y += forward.y;
    moveVec.z += forward.z;
  }
  if (mp.keys.isDown(KEY_S)) {
    moveVec.x -= forward.x;
    moveVec.y -= forward.y;
    moveVec.z -= forward.z;
  }
  
  // Left/Right (A/D)
  if (mp.keys.isDown(KEY_A)) {
    moveVec.x -= right.x;
    moveVec.y -= right.y;
  }
  if (mp.keys.isDown(KEY_D)) {
    moveVec.x += right.x;
    moveVec.y += right.y;
  }
  
  // Up/Down (SPACE/CTRL)
  // SPACE = sus, LCTRL = jos
  if (mp.keys.isDown(KEY_SPACE)) {
    moveVec.z += 1.0; // Sus
  }
  if (mp.keys.isDown(KEY_LCTRL)) {
    moveVec.z -= 1.0; // Jos
  }
  
  // Normalizează vectorul de mișcare
  return normalizeVector(moveVec);
}

/**
 * Render handler pentru fly mode movement
 * Guarded by flyActive - rulează doar când flyActive = true
 * Atașat o singură dată la load, folosește guard pentru start/stop
 */
let lastSpeedLog = 0; // Throttle pentru log speed

const renderHandler = () => {
  // Guard: execută doar dacă fly mode este activ
  if (!flyActive) {
    return;
  }

  try {
    const player = mp.players.local;
    
    // Calculează vectorul de mișcare
    const moveVec = calculateMoveVector();
    
    // Verifică dacă există input (dacă vectorul nu e zero)
    if (moveVec.x === 0 && moveVec.y === 0 && moveVec.z === 0) {
      return; // Nu se mișcă
    }
    
    // Verifică boost (LSHIFT)
    const isBoosting = mp.keys.isDown(KEY_LSHIFT);
    flySpeed = isBoosting ? BOOST_MULTIPLIER : 1.0;
    
    // Calculează viteza finală
    const speed = BASE_SPEED * flySpeed;
    
    // Calculează noua poziție
    // Entity::position property (wiki)
    const currentPos = player.position;
    const newPos = new mp.Vector3(
      currentPos.x + moveVec.x * speed,
      currentPos.y + moveVec.y * speed,
      currentPos.z + moveVec.z * speed
    );
    
    // Setează noua poziție
    player.position = newPos;
    
    // Log speed + pos la fiecare secundă (throttle)
    const now = Date.now();
    if (now - lastSpeedLog > 1000) {
      console.log(`[Fly] Speed: ${flySpeed.toFixed(1)}x, Position: x=${newPos.x.toFixed(2)} y=${newPos.y.toFixed(2)} z=${newPos.z.toFixed(2)}`);
      lastSpeedLog = now;
      
      // Update UI cu speed multiplier
      updateUI(true, flySpeed);
    }
  } catch (e) {
    console.log('[Fly] Error in render loop:', e);
  }
};

// Atașează render handler o singură dată la load
// Handler-ul folosește guard flyActive pentru start/stop
if (!renderHandlerAttached) {
  mp.events.add('render', renderHandler);
  renderHandlerAttached = true;
  console.log('[Fly] Render loop attached (guarded by flyActive)');
}

/**
 * Event handler pentru toggle fly mode de la server
 * Wiki: Events::add - ascultă event-uri trimise de server
 */
mp.events.add('admin:fly:toggle', (state) => {
  console.log(`[Fly] Toggle received state=${state} (type: ${typeof state})`);
  
  // Normalizează state (asigură boolean)
  const normalizedState = state === true || state === 1 || state === 'true';
  
  if (normalizedState) {
    enableFly();
  } else {
    disableFly();
  }
});

console.log('[Fly] Fly module loaded');
