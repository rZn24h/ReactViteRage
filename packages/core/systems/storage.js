// [Server] Sistem de persistence JSON pentru datele jucătorului
// Salvează/încarcă poziție, model, bani în fișiere JSON pe disc
// Locatie: server_data/players/[PlayerName].json

const fs = require('fs');
const path = require('path');

// Path-uri absolute pentru directorul de date
const DATA_ROOT = path.join(process.cwd(), 'server_data');
const PLAYERS_DIR = path.join(DATA_ROOT, 'players');

/**
 * Asigură că directoarele necesare există (mkdir recursive)
 * Executat la începutul fiecărei operațiuni de I/O
 */
function ensureDirs() {
  try {
    // Creează recursiv directoarele dacă nu există
    fs.mkdirSync(PLAYERS_DIR, { recursive: true });
    console.log('[Storage] Directories ensured:', PLAYERS_DIR);
  } catch (e) {
    console.log('[Storage] Failed to ensure directories:', e.message);
  }
}

/**
 * Generează path-ul fișierului JSON pentru un jucător
 * Sanitizează numele jucătorului pentru a evita caractere invalide în numele fișierului
 * @param {PlayerMp} player - Obiectul jucător RAGE:MP
 * @returns {string} - Path complet către fișierul JSON
 */
function getPlayerFile(player) {
  // Sanitizează numele: păstrează doar caractere alfanumerice, underscore și hyphen
  // Înlocuiește caracterele invalide cu underscore pentru securitate
  const safeName = String(player.name).replace(/[^\w\-]/g, '_');
  const filePath = path.join(PLAYERS_DIR, `${safeName}.json`);
  console.log(`[Storage] Player file path for ${player.name}:`, filePath);
  return filePath;
}

/**
 * Creează un profil default pentru un jucător nou
 * Folosit când nu există fișier JSON sau când fișierul este corupt
 * @param {PlayerMp} player - Obiectul jucător RAGE:MP
 * @returns {Object} - Obiect de profil default
 */
function defaultProfile(player) {
  const profile = {
    name: player.name,
    position: {
      x: player.position.x || 0,
      y: player.position.y || 0,
      z: player.position.z || 0
    },
    model: player.model || mp.joaat('mp_m_freemode_01'), // Default GTA Online male model hash
    money: 0
  };
  console.log(`[Storage] Created default profile for ${player.name}:`, profile);
  return profile;
}

/**
 * Aplică un profil încărcat pe jucător (poziție, model, bani)
 * Folosește API-urile RAGE:MP: Entity::position, Player::model
 * @param {PlayerMp} player - Obiectul jucător RAGE:MP
 * @param {Object} profile - Obiect de profil cu datele de aplicat
 */
function applyProfile(player, profile) {
  console.log(`[Storage] Applying profile for ${player.name}:`, profile);
  
  try {
    // Asigură că player.data există
    if (!player.data) {
      player.data = {};
    }

    // Aplică poziția: Entity::position property (wiki)
    if (profile.position && typeof profile.position === 'object') {
      const pos = profile.position;
      if (typeof pos.x === 'number' && typeof pos.y === 'number' && typeof pos.z === 'number') {
        player.position = new mp.Vector3(pos.x, pos.y, pos.z + 1.0); // Fix: Added Z offset to prevent falling
        console.log(`[Storage] Applied position to ${player.name}:`, { x: pos.x, y: pos.y, z: pos.z + 1.0 });
        
        // Freeze player 2 secunde după spawn pentru încărcarea hărții
        try {
          console.log(`[Storage] Freeze player 2s after spawn: ${player.name}`);
          player.call('freeze', [true]);

          setTimeout(() => {
            try {
              // Verifică dacă player-ul mai există (poate s-a deconectat)
              if (player && player.valid) {
                player.call('freeze', [false]);
                console.log(`[Storage] Unfreeze player: ${player.name}`);
              } else {
                console.log(`[Storage] Player ${player?.name || 'unknown'} disconnected, skipping unfreeze`);
              }
            } catch (e) {
              console.log(`[Storage] Unfreeze failed for ${player?.name || 'unknown'}:`, e.message);
            }
          }, 2000);
        } catch (e) {
          console.log(`[Storage] Freeze call failed for ${player.name}:`, e.message);
        }
      } else {
        console.log(`[Storage] Invalid position data for ${player.name}, using current position`);
      }
    } else {
      console.log(`[Storage] No position data in profile for ${player.name}`);
    }

    // Aplică modelul: Player::model property (wiki)
    if (typeof profile.model === 'number' && profile.model > 0) {
      player.model = profile.model;
      console.log(`[Storage] Applied model to ${player.name}:`, profile.model);
    } else {
      console.log(`[Storage] Invalid or missing model for ${player.name}, keeping current model`);
    }

    // Fix: RAGE:MP server nu are player.setMoney; stocăm banii în data.
    const moneyValue = profile.money ?? 1000;
    if (typeof moneyValue === 'number' && moneyValue >= 0) {
      player.data.money = moneyValue;
      console.log(`[Storage] Money loaded: ${moneyValue} for ${player.name}`);
    } else {
      player.data.money = 1000; // Default money
      console.log(`[Storage] Invalid money value for ${player.name}, setting to default 1000`);
    }

    // Stochează profilul în player.data pentru acces rapid la quit
    player.data.profile = profile;
    
    console.log(`[Storage] Profile successfully applied for ${player.name}`);
  } catch (e) {
    console.log(`[Storage] Failed to apply profile for ${player.name}:`, e.message);
    console.log(`[Storage] Error stack:`, e.stack);
  }
}

/**
 * Încarcă profilul jucătorului din fișier JSON sau creează unul default
 * Executat la playerJoin event
 * @param {PlayerMp} player - Obiectul jucător RAGE:MP
 */
function loadPlayer(player) {
  console.log(`[Storage] Loading player data for ${player.name}`);
  
  // Asigură că directoarele există
  ensureDirs();
  
  const file = getPlayerFile(player);

  try {
    // Verifică dacă fișierul există
    if (fs.existsSync(file)) {
      console.log(`[Storage] File exists for ${player.name}, attempting to read...`);
      
      // Citește fișierul
      const raw = fs.readFileSync(file, 'utf8');
      console.log(`[Storage] File read successfully for ${player.name}, size:`, raw.length, 'bytes');
      
      // Parse JSON cu try/catch pentru a gestiona JSON corupt
      try {
        const profile = JSON.parse(raw);
        console.log(`[Storage] JSON parsed successfully for ${player.name}`);
        console.log(`[Storage] Profile data:`, profile);
        
        // Aplică profilul pe jucător
        applyProfile(player, profile);
        return;
      } catch (parseError) {
        // JSON corupt sau invalid
        console.log(`[Storage] Corrupt JSON for ${player.name}. Parse error:`, parseError.message);
        console.log(`[Storage] Creating default profile instead`);
        // Continuă mai jos pentru a crea profil default
      }
    } else {
      console.log(`[Storage] No file found for ${player.name}, creating default profile`);
    }
  } catch (readError) {
    // Eroare la citirea fișierului
    console.log(`[Storage] Error reading file for ${player.name}:`, readError.message);
    console.log(`[Storage] Creating default profile instead`);
  }

  // Dacă ajungem aici, fie nu există fișier, fie e corupt, fie e eroare la citire
  // Creează și aplică profil default
  const profile = defaultProfile(player);
  applyProfile(player, profile);
  
  // Salvează profilul default pentru următoarea oară
  savePlayer(player);
  console.log(`[Storage] Default profile created and saved for ${player.name}`);
}

/**
 * Salvează profilul jucătorului în fișier JSON
 * Executat la playerQuit event
 * Actualizează datele din starea live a jucătorului înainte de salvare
 * @param {PlayerMp} player - Obiectul jucător RAGE:MP
 */
function savePlayer(player) {
  console.log(`[Storage] Saving player data for ${player.name}`);
  
  // Asigură că directoarele există
  ensureDirs();
  
  const file = getPlayerFile(player);

  try {
    // Obține profilul din player.data sau creează unul default
    let profile = player.data && player.data.profile ? player.data.profile : defaultProfile(player);
    
    // Actualizează datele din starea live a jucătorului
    // Entity::position property (wiki)
    profile.position = {
      x: player.position.x,
      y: player.position.y,
      z: player.position.z
    };
    console.log(`[Storage] Updated position from live state:`, profile.position);

    // Player::model property (wiki)
    profile.model = player.model;
    console.log(`[Storage] Updated model from live state:`, profile.model);

    // Money: folosim player.data.money (stocat în data, nu via API inexistent)
    // Dacă nu există în data, folosește ce e în profile sau default 1000
    profile.money = player.data.money ?? profile.money ?? 1000;
    if (typeof profile.money !== 'number' || profile.money < 0) {
      profile.money = 1000; // Default money
    }
    console.log(`[Storage] Updated money from player.data:`, profile.money);

    // Actualizează numele (în cazul în care s-a schimbat)
    profile.name = player.name;

    // Scrie JSON pretty cu indentare de 2 spații
    const jsonString = JSON.stringify(profile, null, 2);
    fs.writeFileSync(file, jsonString, 'utf8');
    
    console.log(`[Storage] Saved user ${player.name} -> ${file}`);
    console.log(`[Storage] File size:`, jsonString.length, 'bytes');
  } catch (e) {
    console.log(`[Storage] Failed saving user ${player.name}:`, e.message);
    console.log(`[Storage] Error stack:`, e.stack);
  }
}

// Event handlers RAGE:MP
// Wiki: Events::playerJoin - triggered when a player connects
mp.events.add('playerJoin', (player) => {
  console.log(`[Storage] playerJoin event triggered for ${player.name}`);
  
  // Inițializează player.data dacă nu există
  if (!player.data) {
    player.data = {};
  }
  
  // Încarcă datele jucătorului
  loadPlayer(player);
});

// Wiki: Events::playerQuit - triggered when a player disconnects
mp.events.add('playerQuit', (player, exitType, reason) => {
  console.log(`[Storage] playerQuit event triggered for ${player.name}, exitType: ${exitType}, reason: ${reason}`);
  
  // Inițializează player.data dacă nu există (pentru siguranță)
  if (!player.data) {
    player.data = {};
  }
  
  // Salvează datele jucătorului
  savePlayer(player);
});

// Export funcții pentru reutilizare în alte module
module.exports = {
  loadPlayer,
  savePlayer,
  applyProfile,
  defaultProfile
};
