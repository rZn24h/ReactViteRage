// [Server] Entry point pentru core server
// Acest fișier este încărcat automat de loader.mjs când serverul pornește
// Environment: Node.js (CommonJS - require/module.exports)

console.log("[Server] Core initialized.");

// Încarcă modulele server
console.log("[Server] Loading modules...");

// Storage system - persistence JSON pentru jucători
try {
  require("./systems/storage");
  console.log("[Server] [Storage] Module loaded");
} catch (e) {
  console.log("[Server] [Storage] Failed to load:", e.message);
}

// Admin commands - /fly, /tpwp
try {
  require("./commands/admin");
  console.log("[Server] [Admin] Module loaded");
} catch (e) {
  console.log("[Server] [Admin] Failed to load:", e.message);
}

// Dev tools commands - /loc
try {
  require("./commands/devtools");
  console.log("[Server] [DevTools] Module loaded");
} catch (e) {
  console.log("[Server] [DevTools] Failed to load:", e.message);
}

// Vehicle commands - /veh
try {
  require("./commands/vehicle");
  console.log("[Server] [Vehicle] Module loaded");
} catch (e) {
  console.log("[Server] [Vehicle] Failed to load:", e.message);
}

// Chat system - custom chat handler
try {
  require("./systems/chat");
  console.log("[Server] [Chat] Module loaded");
} catch (e) {
  console.log("[Server] [Chat] Failed to load:", e.message);
}

console.log("[Server] All modules loaded successfully.");
