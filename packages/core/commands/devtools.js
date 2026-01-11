// [Server] Comenzi pentru developer tools
// Conține: /loc (coordonate manager) și salvare coordonate în fișier
// Environment: Node.js (CommonJS)
// 
// NOTĂ: Comenzile sunt gestionate prin chat custom (server:command)
// Commands are handled via custom chat (server:command)

const fs = require('fs');
const path = require('path');

// Path pentru fișierul de log coordonate
const DATA_ROOT = path.join(process.cwd(), 'server_data');
const COORDS_LOG_FILE = path.join(DATA_ROOT, 'coords_log.txt');

/**
 * Asigură că directorul server_data există
 */
function ensureDataDir() {
  try {
    fs.mkdirSync(DATA_ROOT, { recursive: true });
    console.log('[Loc] Data directory ensured:', DATA_ROOT);
  } catch (e) {
    console.log('[Loc] Failed to ensure data directory:', e.message);
  }
}

/**
 * Comandă: /loc
 * Toggle fereastra UI pentru coords manager
 * Trimite event la client pentru a deschide/închide UI-ul
 * 
 * NOTĂ: Comandă gestionată prin chat custom (server:command)
 * Înainte folosea: mp.events.addCommand('loc', ...)
 * Acum este procesată în: packages/core/systems/chat/index.js -> server:command handler
 */
// Comandă dezactivată - gestionată prin chat custom
// mp.events.addCommand('loc', (player) => {
//   // Logică mutată în packages/core/systems/chat/index.js
// });

/**
 * Event handler pentru salvare coordonate din UI
 * Primește: player, name (string), x, y, z, heading (numbers)
 * Scrie o linie în server_data/coords_log.txt cu timestamp
 * Wiki: Events::callRemote - event trimis de client către server
 */
mp.events.add('dev:loc:save', (player, name, x, y, z, heading) => {
  console.log(`[Loc] Received save request from ${player.name}:`, { name, x, y, z, heading });

  // Validare date
  if (!name || typeof name !== 'string' || name.length < 1 || name.length > 64) {
    console.log(`[Loc] Invalid name from ${player.name}:`, name);
    player.outputChatBox('[Loc] Invalid position name (1-64 characters)');
    return;
  }

  if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number' || typeof heading !== 'number') {
    console.log(`[Loc] Invalid coordinates from ${player.name}:`, { x, y, z, heading });
    player.outputChatBox('[Loc] Invalid coordinates');
    return;
  }

  if (!isFinite(x) || !isFinite(y) || !isFinite(z) || !isFinite(heading)) {
    console.log(`[Loc] Non-finite coordinates from ${player.name}`);
    player.outputChatBox('[Loc] Invalid coordinate values (NaN or Infinity)');
    return;
  }

  // Asigură că directorul există
  ensureDataDir();

  // Generează timestamp ISO format
  const timestamp = new Date().toISOString();
  
  // Format linie: timestamp | PlayerName | PositionName | x=... y=... z=... h=...
  const logLine = `${timestamp} | ${player.name} | ${name} | x=${x.toFixed(4)} y=${y.toFixed(4)} z=${z.toFixed(4)} h=${heading.toFixed(2)}\n`;
  
  try {
    // Append la fișier (creează fișierul dacă nu există)
    fs.appendFileSync(COORDS_LOG_FILE, logLine, 'utf8');
    console.log(`[Loc] Saved to coords_log.txt: ${name} at (${x}, ${y}, ${z}) heading ${heading}`);
    console.log(`[Loc] Log line:`, logLine.trim());
    
    player.outputChatBox(`[Loc] Position "${name}" saved to server log!`);
  } catch (e) {
    console.log(`[Loc] Failed to save coordinates for ${player.name}:`, e.message);
    console.log(`[Loc] Error stack:`, e.stack);
    player.outputChatBox('[Loc] Failed to save coordinates to server log');
  }
});
