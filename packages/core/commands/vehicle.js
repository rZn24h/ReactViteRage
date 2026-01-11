// [Server] Comenzi pentru spawn vehicule
// Conține: /veh [model] - spawn rapid de vehicule
// Environment: Node.js (CommonJS)
// 
// NOTĂ: Comenzile sunt gestionate prin chat custom (server:command)
// Commands are handled via custom chat (server:command)

/**
 * Comandă: /veh [model]
 * Spawn rapid de vehicule (inclusiv dlcpacks custom ex: m4comp)
 * Wiki: Events::addCommand - callback primește (player, fullText, ...args)
 * 
 * NOTĂ: Comandă gestionată prin chat custom (server:command)
 * Înainte folosea: mp.events.addCommand('veh', ...)
 * Acum este procesată în: packages/core/systems/chat/index.js -> server:command handler
 * 
 * Commands are handled via custom chat (server:command)
 */
// Comandă dezactivată - gestionată prin chat custom
// Logica completă a fost mutată în packages/core/systems/chat/index.js

console.log('[VehicleCmd] Vehicle commands module loaded (handled via chat system)');
