// [Server] Hacker System - NetRunner / Hacker pentru ATM
// Environment: Node.js (CommonJS)
// Funcționalitate: Gestionează request-uri de hack, aprobă start, dă reward/fail
// CRITIC: Exportă init() și NU folosește mp la top-level pentru a evita "mp is not defined"

/**
 * Helper pentru chat message
 * @param {PlayerMp} player - Jucătorul
 * @param {string} text - Textul mesajului
 * @param {string} color - Culoarea (hex, default #9fd3ff)
 */
function chat(player, text, color = "#9fd3ff") {
  try { 
    player.call("chat:push", [text, color]); 
  } catch (e) {
    console.log(`[Hacker] chat error for ${player.name}:`, e);
  }
}

/**
 * Asigură că player.data există și are money
 * @param {PlayerMp} player - Jucătorul
 */
function ensureData(player) {
  if (!player.data) player.data = {};
  if (typeof player.data.money !== "number") player.data.money = 0;
}

/**
 * Inițializează sistemul hacker
 * CRITIC: Se apelează DOAR când global.mp există
 */
function init() {
  if (!global.mp) {
    console.log("[Hacker] init called but mp not available yet.");
    return;
  }

  console.log("[Hacker] Initializing hacker system...");

  // Client -> Server: request start hack
  mp.events.add("server:hacker:requestStart", (player) => {
    try {
      console.log(`[Hacker] ${player.name} requested hack start.`);
      
      ensureData(player);

      // TODO: verifică item Cyberdeck în inventar
      // if (!player.data.hasCyberdeck) { 
      //   chat(player, "[HACK] Nu ai Cyberdeck.", "#ff5555"); 
      //   return; 
      // }

      // Aprobă start și trimite către client
      player.call("client:hacker:start", []);
      chat(player, "!{#00FFFF}[HACK]!{#FFFFFF} Conectare la sistem... Sparge firewall-ul!");
      console.log(`[Hacker] Hack session started for ${player.name}`);
    } catch (e) {
      console.log(`[Hacker] requestStart error for ${player.name}:`, e);
    }
  });

  // Client -> Server: result hack (success/fail)
  mp.events.add("server:hacker:result", (player, success) => {
    try {
      console.log(`[Hacker] ${player.name} finished hack: ${success ? "SUCCESS" : "FAIL"}`);
      
      ensureData(player);
      const ok = !!success;

      if (ok) {
        // Reward: 300-700 money
        const reward = Math.floor(Math.random() * 401) + 300; // 300-700
        player.data.money += reward;
        chat(player, `!{#00FF00}[SUCCESS]!{#FFFFFF} Sistem spart! Ai primit $${reward}.`);
        chat(player, `!{#FFAA00}[ALERT]!{#FFFFFF} Alarm triggered! Change clothes within 2 minutes!`);
        console.log(`[Hacker] SUCCESS ${player.name} +$${reward} money=${player.data.money}`);
      } else {
        chat(player, "!{#FF0000}[FAIL]!{#FFFFFF} Alarma a pornit! Poliția a fost alertată.");
        console.log(`[Hacker] FAIL ${player.name} -> TODO wanted`);
        // TODO: wanted system / alert police
      }
    } catch (e) {
      console.log(`[Hacker] result error for ${player.name}:`, e);
    }
  });

  // Client -> Server: safe (jucătorul a scăpat)
  mp.events.add("server:hacker:safe", (player) => {
    try {
      console.log(`[Hacker] ${player.name} escaped successfully from getaway`);
      
      ensureData(player);
      
      // Bonus mic de RP sau money pentru evadare reușită
      const bonus = 50;
      player.data.money += bonus;
      
      chat(player, `!{#00FF00}[ESCAPED]!{#FFFFFF} Police lost your trail! Bonus: +$${bonus}.`);
      console.log(`[Hacker] SAFE ${player.name} +$${bonus} money=${player.data.money}`);
    } catch (e) {
      console.log(`[Hacker] safe error for ${player.name}:`, e);
    }
  });

  console.log("[Hacker] Events registered successfully.");
}

module.exports = { init };
