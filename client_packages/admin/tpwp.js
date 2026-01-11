// [Client] Teleport to Waypoint cu calcul Ground Z
// Rulează în context RAGE:MP Client (NU Node.js, FĂRĂ require/fs)
// Folosește: mp.game.ui.getFirstBlipInfoId, mp.game.ui.getBlipInfoIdCoord, mp.game.gameplay.getGroundZFor3dCoord

/**
 * Verifică dacă există un waypoint activ pe hartă
 * Wiki: UI::isWaypointActive - verifică dacă waypoint-ul este activ
 * @returns {boolean} - true dacă waypoint-ul este activ
 */
function isWaypointActive() {
  try {
    // Wiki: UI::isWaypointActive - returnează boolean
    // Dacă metoda nu există, folosim o metodă alternativă
    if (typeof mp.game.ui.isWaypointActive === 'function') {
      return mp.game.ui.isWaypointActive();
    }
    
    // Fallback: verifică dacă există un blip de tip waypoint
    // Blip type 8 este folosit uzual pentru waypoint în GTA V
    const blip = mp.game.ui.getFirstBlipInfoId(8);
    return blip !== 0; // 0 = invalid blip
  } catch (e) {
    console.log('[TPWP] Error checking waypoint active:', e);
    return false;
  }
}

/**
 * Obține coordonatele waypoint-ului de pe hartă
 * Wiki: UI::getFirstBlipInfoId - obține ID-ul primului blip de un anumit tip
 * Wiki: UI::getBlipInfoIdCoord - obține coordonatele unui blip
 * @returns {mp.Vector3|null} - Coordonatele waypoint-ului sau null dacă nu există
 */
function getWaypointCoordinates() {
  try {
    // Wiki: UI::getFirstBlipInfoId(blipType) - tip 8 = waypoint
    const blipId = mp.game.ui.getFirstBlipInfoId(8);
    
    if (blipId === 0) {
      console.log('[TPWP] No waypoint blip found (blipId = 0)');
      return null;
    }
    
    console.log('[TPWP] Found waypoint blip, ID:', blipId);
    
    // Wiki: UI::getBlipInfoIdCoord(blip) - returnează Vector3 cu coordonatele
    const coords = mp.game.ui.getBlipInfoIdCoord(blipId);
    
    console.log('[TPWP] Waypoint coordinates:', coords);
    return coords;
  } catch (e) {
    console.log('[TPWP] Error getting waypoint coordinates:', e);
    return null;
  }
}

/**
 * Calculează ground Z (înălțimea solului) pentru coordonatele date
 * Wiki: Gameplay::getGroundZFor3dCoord - caută primul suprafață sub coordonatele date
 * IMPORTANT: Funcția caută "first surface beneath", deci trebuie să pornești cu o înălțime mare
 * @param {number} x - Coordonata X
 * @param {number} y - Coordonata Y
 * @param {number} startZ - Înălțimea de start pentru căutare (ex: 1000.0)
 * @returns {number|null} - Ground Z sau null dacă nu se găsește
 */
function getGroundZ(x, y, startZ = 1000.0) {
  try {
    console.log(`[TPWP] Calculating ground Z for (${x}, ${y}), starting from Z=${startZ}`);
    
    // Wiki: Gameplay::getGroundZFor3dCoord(x, y, z, groundZ, ignoreWater)
    // Returnează: [boolean found, number groundZ] (array) sau obiect {found, groundZ}
    // Verificăm ambele formate posibile
    
    let result = null;
    let found = false;
    let groundZ = 0;
    
    // Încearcă să apeleze funcția nativă
    // În RAGE:MP JS wrapper, getGroundZFor3dCoord poate returna:
    // - Array: [found, groundZ]
    // - Object: {found, groundZ}
    // - Sau poate fi apelată prin mp.game.gameplay.getGroundZFor3dCoord(...)
    
    try {
      // Versiune 1: array return
      const nativeResult = mp.game.gameplay.getGroundZFor3dCoord(x, y, startZ, 0, false);
      
      if (Array.isArray(nativeResult)) {
        found = nativeResult[0] === true || nativeResult[0] === 1;
        groundZ = nativeResult[1] || nativeResult[0]; // Ajustează indexul dacă e necesar
        console.log('[TPWP] getGroundZFor3dCoord returned array:', nativeResult);
      } else if (typeof nativeResult === 'object' && nativeResult !== null) {
        // Versiune 2: object return
        found = nativeResult.found === true || nativeResult.found === 1;
        groundZ = nativeResult.groundZ || nativeResult.z || 0;
        console.log('[TPWP] getGroundZFor3dCoord returned object:', nativeResult);
      } else if (typeof nativeResult === 'number') {
        // Versiune 3: direct number (doar groundZ)
        found = true;
        groundZ = nativeResult;
        console.log('[TPWP] getGroundZFor3dCoord returned number:', nativeResult);
      } else {
        // Versiune 4: boolean (doar found)
        found = nativeResult === true || nativeResult === 1;
        // Încearcă să obțină groundZ separat sau folosește startZ ca fallback
        groundZ = startZ;
        console.log('[TPWP] getGroundZFor3dCoord returned boolean:', nativeResult);
      }
    } catch (nativeError) {
      console.log('[TPWP] Error calling getGroundZFor3dCoord native:', nativeError);
      // Fallback: folosește coordonata Z originală
      found = false;
      groundZ = startZ;
    }
    
    if (found) {
      console.log(`[TPWP] Ground Z found: ${groundZ}`);
      return groundZ;
    } else {
      console.log('[TPWP] Ground Z not found, using fallback');
      // Fallback: folosește o valoare default (ex: 0 sau coordonata Z originală)
      return 0; // Sau return null și la server se va folosi coordonata Z originală
    }
  } catch (e) {
    console.log('[TPWP] Error calculating ground Z:', e);
    return null;
  }
}

/**
 * Event handler pentru request de calculare waypoint de la server
 * Calculează coordonatele waypoint-ului, groundZ, și trimite înapoi la server
 * Wiki: Events::add - ascultă event-uri trimise de server
 */
mp.events.add('admin:tpwp:request', () => {
  console.log('[TPWP] Received admin:tpwp:request from server');
  
  // Verifică dacă waypoint-ul este activ
  if (!isWaypointActive()) {
    console.log('[TPWP] No active waypoint found');
    mp.gui.chat.push('[TPWP] No waypoint active on map!');
    
    // Trimite eroare la server
    // Wiki: Events::callRemote - trimite event către server
    mp.events.callRemote('admin:tpwp:result', false, 'No waypoint active');
    return;
  }
  
  // Obține coordonatele waypoint-ului
  const waypointCoords = getWaypointCoordinates();
  if (!waypointCoords) {
    console.log('[TPWP] Failed to get waypoint coordinates');
    mp.gui.chat.push('[TPWP] Failed to get waypoint coordinates');
    mp.events.callRemote('admin:tpwp:result', false, 'Failed to get waypoint coordinates');
    return;
  }
  
  console.log('[TPWP] Waypoint coordinates retrieved:', waypointCoords);
  
  // Calculează ground Z
  // Pornește de la o înălțime mare (1000.0) pentru că funcția caută "first surface beneath"
  const groundZ = getGroundZ(waypointCoords.x, waypointCoords.y, 1000.0);
  
  if (groundZ === null) {
    console.log('[TPWP] Failed to calculate ground Z, using waypoint Z coordinate');
    // Fallback: folosește coordonata Z a waypoint-ului (poate fi 0 sau o valoare default)
    const finalZ = waypointCoords.z > 0 ? waypointCoords.z : 0;
    mp.events.callRemote('admin:tpwp:result', true, waypointCoords.x, waypointCoords.y, finalZ + 1.0);
    console.log(`[TPWP] Computed waypoint fallback: x=${waypointCoords.x} y=${waypointCoords.y} z=${finalZ + 1.0} foundGround=false`);
    mp.gui.chat.push('[TPWP] Teleporting to waypoint (ground Z not found, using fallback)');
  } else {
    // Trimite coordonatele cu groundZ + 1.0 (pentru a fi deasupra solului)
    const finalZ = groundZ + 1.0;
    mp.events.callRemote('admin:tpwp:result', true, waypointCoords.x, waypointCoords.y, finalZ);
    console.log(`[TPWP] Computed waypoint: x=${waypointCoords.x} y=${waypointCoords.y} z=${finalZ} foundGround=true groundZ=${groundZ}`);
    mp.gui.chat.push('[TPWP] Teleporting to waypoint with ground Z calculation!');
  }
});

console.log('[TPWP] TPWP module loaded');
