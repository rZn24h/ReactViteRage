// [Server] Admin Panel System - Dashboard pentru Server Stats
// Environment: Node.js (CommonJS)
// Funcționalitate: Trimite toggle + payload inițial către client pentru UI Dashboard

/**
 * Obține numele serverului din config sau fallback
 * @returns {string} Numele serverului
 */
function getServerName() {
  // În funcție de template, mp.config poate exista sau nu.
  // Păstrăm safe fallback.
  try {
    if (mp && mp.config && mp.config.name) return String(mp.config.name);
  } catch (_) {}
  return "RAGE Server";
}

/**
 * Construiește payload-ul inițial pentru dashboard
 * @returns {Object} Payload cu serverName, players, uptime, commands
 */
function buildPayload() {
  console.log("[AdminPanel] Building dashboard payload...");
  
  return {
    serverName: getServerName(),
    players: mp.players.length,
    uptime: process.uptime(),
    commands: [
      "/veh",
      "/fly",
      "/tpwp",
      "/loc",
      "/myweather",
      "/togsnow",
      "/sett",
      "/setw",
      "/stats",
      "/me",
      "/server",
    ],
  };
}

/**
 * Deschide dashboard-ul pentru un jucător
 * @param {PlayerMp} player - Jucătorul pentru care se deschide dashboard-ul
 */
function openDashboard(player) {
  try {
    console.log(`[AdminPanel] Open dashboard for ${player.name}`);
    
    // Trimite toggle event către client
    // Wiki: Player::call - trimite event la un anumit player
    player.call("dashboard:toggle", [true]);
    
    // Construiește și trimite payload-ul inițial
    const payload = buildPayload();
    player.call("dashboard:update", [payload]);
    
    console.log(`[AdminPanel] Dashboard opened for ${player.name}, payload:`, payload);
  } catch (e) {
    console.log("[AdminPanel] openDashboard error:", e);
    console.log("[AdminPanel] Error stack:", e.stack);
  }
}

module.exports = { openDashboard, buildPayload };
