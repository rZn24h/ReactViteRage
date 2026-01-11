// [Server] Comenzi admin pentru RAGE:MP
// Conține: /fly (noclip toggle) și /tpwp (teleport to waypoint)
// Environment: Node.js (CommonJS)
// 
// NOTĂ: Comenzile sunt gestionate prin chat custom (server:command)
// Commands are handled via custom chat (server:command)

/**
 * Comandă: /fly
 * Toggle noclip mode pentru jucător
 * Fără restricții admin (permite tuturor)
 * Folosește player.data.flyMode ca sursă unică de adevăr
 * 
 * NOTĂ: Comandă gestionată prin chat custom (server:command)
 * Înainte folosea: mp.events.addCommand('fly', ...)
 * Acum este procesată în: packages/core/systems/chat/index.js -> server:command handler
 */
// Comandă dezactivată - gestionată prin chat custom
// mp.events.addCommand('fly', (player) => {
//   // Logică mutată în packages/core/systems/chat/index.js
// });

/**
 * Event handler pentru rezultatul calculării waypoint de la client
 * Clientul calculează coordonatele waypoint-ului și groundZ, apoi trimite aici
 * Wiki: Events::callRemote - event trimis de client către server
 */
mp.events.add('admin:tpwp:result', (player, ok, xOrMsg, y, z) => {
  console.log(`[TPWP] Received result from ${player.name}, ok: ${ok}`);
  
  if (!ok) {
    // Clientul a trimis un mesaj de eroare
    const errorMsg = xOrMsg || 'Unknown error';
    console.log(`[TPWP] Error from client: ${errorMsg}`);
    
    // Feedback prin chat custom
    try {
      player.call('chat:push', [`[TPWP] Error: ${errorMsg}`, '#ff0000']);
    } catch (e) {
      // Fallback la outputChatBox dacă chat custom eșuează
      player.outputChatBox(`[TPWP] Error: ${errorMsg}`);
    }
    return;
  }

  // Clientul a trimis coordonate valide
  // Parametrii: ok (boolean), x (number), y (number), z (number)
  if (typeof xOrMsg === 'number' && typeof y === 'number' && typeof z === 'number') {
    const x = xOrMsg;
    
    console.log(`[TPWP] Valid coordinates received: x=${x}, y=${y}, z=${z}`);
    
    // Teleportează jucătorul: Entity::position property (wiki)
    try {
      player.position = new mp.Vector3(x, y, z);
      console.log(`[TPWP] Teleported ${player.name} -> x:${x} y:${y} z:${z}`);
      
      // Feedback prin chat custom
      try {
        player.call('chat:push', ['[TPWP] Teleported to waypoint!', '#00ff00']);
      } catch (e) {
        // Fallback la outputChatBox dacă chat custom eșuează
        player.outputChatBox(`[TPWP] Teleported to waypoint!`);
      }
    } catch (e) {
      console.log(`[TPWP] Failed to teleport ${player.name}:`, e.message);
      
      // Feedback prin chat custom
      try {
        player.call('chat:push', [`[TPWP] Teleport failed: ${e.message}`, '#ff0000']);
      } catch (_) {
        // Fallback la outputChatBox dacă chat custom eșuează
        player.outputChatBox(`[TPWP] Teleport failed: ${e.message}`);
      }
    }
  } else {
    console.log(`[TPWP] Invalid coordinates format from ${player.name}`);
    
    // Feedback prin chat custom
    try {
      player.call('chat:push', ['[TPWP] Invalid coordinates received', '#ff0000']);
    } catch (e) {
      // Fallback la outputChatBox dacă chat custom eșuează
      player.outputChatBox(`[TPWP] Invalid coordinates received.`);
    }
  }
});

/**
 * Comandă: /tpwp
 * Teleport la waypoint (marcajul de pe hartă)
 * Serverul cere clientului să calculeze coordonatele waypoint-ului + groundZ
 * Clientul trimite rezultatul înapoi prin event admin:tpwp:result
 * 
 * NOTĂ: Comandă gestionată prin chat custom (server:command)
 * Înainte folosea: mp.events.addCommand('tpwp', ...)
 * Acum este procesată în: packages/core/systems/chat/index.js -> server:command handler
 */
// Comandă dezactivată - gestionată prin chat custom
// mp.events.addCommand('tpwp', (player) => {
//   // Logică mutată în packages/core/systems/chat/index.js
// });
