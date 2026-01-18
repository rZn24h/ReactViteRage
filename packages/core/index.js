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

// Vehicle utils commands - /fix, /dv, /flip, /color
try {
  require("./commands/vehicle_utils");
  console.log("[Server] [VehicleUtils] Module loaded");
} catch (e) {
  console.log("[Server] [VehicleUtils] Failed to load:", e.message);
}

// Chat system - custom chat handler
try {
  require("./systems/chat");
  console.log("[Server] [Chat] Module loaded");
} catch (e) {
  console.log("[Server] [Chat] Failed to load:", e.message);
}

// Admin Panel system - dashboard server stats
try {
  require("./systems/adminPanel");
  console.log("[Server] [AdminPanel] Module loaded");
} catch (e) {
  console.log("[Server] [AdminPanel] Failed to load:", e.message);
}

// Hacker system - NetRunner / Hacker pentru ATM (SAFE init pattern)
try {
  const hackerModule = require("./systems/hacker");
  // Apelează init() - funcția are guard intern pentru mp
  hackerModule.init();
  console.log("[Server] [Hacker] Module loaded");
} catch (e) {
  console.log("[Server] [Hacker] Failed to load:", e.message);
}

// Auth system - Login/Register pentru jucători
try {
  require("./systems/auth");
  console.log("[Server] [Auth] Module loaded");
} catch (e) {
  console.log("[Server] [Auth] Failed to load:", e.message);
}

console.log("[Server] All modules loaded successfully.");
