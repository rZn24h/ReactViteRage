// [Server] Sistem de Chat Custom
// Gestionează mesajele chat și comenzile (/me, /stats)
// Environment: Node.js (CommonJS)

const fs = require("fs");
const path = require("path");
const adminPanel = require("../adminPanel");

// Path pentru fișierele de date jucători (pentru /stats)
const DATA_ROOT = path.join(process.cwd(), "server_data");
const PLAYERS_DIR = path.join(DATA_ROOT, "players");

/**
 * Încarcă datele jucătorului din JSON pentru comanda /stats
 * Folosește același sistem ca storage.js
 * @param {string} playerName - Numele jucătorului
 * @returns {Object|null} - Profilul jucătorului sau null
 */
function loadPlayerData(playerName) {
  try {
    const safeName = String(playerName).replace(/[^\w\-]/g, "_");
    const filePath = path.join(PLAYERS_DIR, `${safeName}.json`);

    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf8");
      const profile = JSON.parse(raw);
      console.log(`[Chat] /stats loaded profile for ${playerName}`);
      return profile;
    } else {
      console.log(`[Chat] /stats no profile file found for ${playerName}`);
      return null;
    }
  } catch (e) {
    console.log(
      `[Chat] /stats error loading profile for ${playerName}:`,
      e.message
    );
    return null;
  }
}

/**
 * Event handler pentru mesaj chat normal
 * Wiki: Events::callRemote - event trimis de client către server
 * Primește: (player, text)
 */
mp.events.add("server:chat", (player, text) => {
  try {
    console.log(`[Chat] Command from ${player.name}: ${text}`);

    // Validare
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      console.log(`[Chat] Invalid or empty message from ${player.name}`);
      return;
    }

    const trimmedText = text.trim();

    // Formatează mesajul: [Nume]: Mesaj
    const formattedMessage = `[${player.name}]: ${trimmedText}`;

    console.log(`[Chat] [${player.name}]: ${trimmedText}`);

    // Trimite la toți jucătorii prin player.call
    // Wiki: Player::call - trimite event la un anumit player
    // Wiki: mp.players.forEach - iterare peste toți jucătorii
    mp.players.forEach((p) => {
      try {
        // Trimite mesaj cu culoare albă (default)
        p.call("chat:push", [formattedMessage, "#ffffff"]);
      } catch (e) {
        console.log(
          `[Chat] Failed to send message to ${p?.name || "unknown"}:`,
          e.message
        );
      }
    });
  } catch (e) {
    console.log(
      `[Chat] ERROR in server:chat for ${player?.name || "unknown"}:`,
      e.message
    );
    console.log(`[Chat] Error stack:`, e.stack);
  }
});

/**
 * Event handler pentru comenzi (primește comanda fără slash)
 * Wiki: Events::callRemote - event trimis de client către server
 * Primește: (player, rawCommandString) ex: "me salut" / "stats"
 */
mp.events.add("server:command", (player, rawCommandString) => {
  try {
    console.log(`[Chat] Command from ${player.name}: ${rawCommandString}`);

    // Validare
    if (
      !rawCommandString ||
      typeof rawCommandString !== "string" ||
      rawCommandString.trim().length === 0
    ) {
      console.log(`[Chat] Invalid or empty command from ${player.name}`);
      return;
    }

    const trimmed = rawCommandString.trim();

    // Parse: cmd = primul cuvânt lower, args = array cu restul argumentelor
    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1); // Array cu argumentele
    const rest = args.join(" "); // String cu restul (pentru compatibilitate cu /me)

    // Log obligatoriu pentru toate comenzile
    console.log(`[ChatCmd] ${player.name}: /${cmd} ${args.join(" ")}`);

    // Handler pentru /fly - toggle noclip mode
    if (cmd === "fly") {
      try {
        // Asigură că player.data există
        if (!player.data) {
          player.data = {};
        }

        // Citește old state (default false dacă nu există)
        const oldState = !!player.data.flyMode;

        // Toggle determinist
        player.data.flyMode = !oldState;

        // New state
        const newState = player.data.flyMode;

        // Log obligatoriu pentru debugging
        console.log(
          `[Fly] Chat toggle ${player.name}: ${oldState} -> ${newState}`
        );

        // Trimite la client strict newState
        // Wiki: Player::call - trimite event la un anumit player
        player.call("admin:fly:toggle", [newState]);
        console.log(`[Fly] Sent toggle to client: ${newState}`);

        // (Opțional) setVariable doar pentru debug - NU se folosește pentru logică
        player.setVariable("admin:fly", newState);

        // Feedback către jucător prin chat custom
        const feedbackMsg = newState ? "Fly mode: ON" : "Fly mode: OFF";
        player.call("chat:push", [feedbackMsg, "#00ff00"]); // Verde pentru feedback
      } catch (e) {
        console.log(
          `[Fly] ERROR in chat toggle for ${player.name}:`,
          e.message
        );
        console.log(`[Fly] Error stack:`, e.stack);
        try {
          player.call("chat:push", [
            "[Fly] Error toggling fly mode",
            "#ff0000",
          ]);
        } catch (_) {}
      }

      return;
    }

    // Handler pentru /tpwp - teleport to waypoint
    if (cmd === "tpwp") {
      try {
        console.log(`[TPWP] Requested by ${player.name}`);

        // Trimite request la client pentru a calcula waypoint-ul
        // Player::call - trimite event la client (wiki)
        player.call("admin:tpwp:request", []);
        console.log(`[TPWP] Request sent to client for ${player.name}`);

        // Feedback către jucător prin chat custom
        player.call("chat:push", [
          "[TPWP] Calculating waypoint coordinates...",
          "#ffff00",
        ]);
      } catch (e) {
        console.log(
          `[TPWP] ERROR in chat command for ${player.name}:`,
          e.message
        );
        console.log(`[TPWP] Error stack:`, e.stack);
        try {
          player.call("chat:push", [
            "[TPWP] Error requesting waypoint",
            "#ff0000",
          ]);
        } catch (_) {}
      }

      return;
    }

    // Handler pentru /loc - toggle coords manager UI
    if (cmd === "loc") {
      try {
        console.log(`[Loc] Toggle requested by ${player.name}`);

        // Trimite event la client pentru toggle UI
        // Player::call - trimite event la client (wiki)
        player.call("dev:loc:toggle", []);
        console.log(
          `[Loc] Sent dev:loc:toggle event to client for ${player.name}`
        );
      } catch (e) {
        console.log(
          `[Loc] ERROR in chat command for ${player.name}:`,
          e.message
        );
        console.log(`[Loc] Error stack:`, e.stack);
        try {
          player.call("chat:push", [
            "[Loc] Error toggling coords manager",
            "#ff0000",
          ]);
        } catch (_) {}
      }

      return;
    }

    // Handler pentru /veh [model] - spawn vehicle
    if (cmd === "veh") {
      try {
        // Validare model
        const model = args[0] ? String(args[0]).trim() : null;

        if (!model) {
          // Trimite eroare prin chat custom
          player.call("chat:push", ["Syntax: /veh [model]", "#ff0000"]);
          console.log(`[VehicleCmd] Invalid syntax from ${player.name}`);
          return;
        }

        console.log(`[VehicleCmd] Chat spawn ${model} for ${player.name}`);

        // Cleanup: dacă jucătorul e deja într-un vehicul, îl distrugem
        // Wiki: Player::vehicle property - returnează vehiculul curent
        if (player.vehicle) {
          const oldVeh = player.vehicle;
          try {
            // Wiki: Entity::destroy - distruge entitatea (vehiculul)
            oldVeh.destroy();
            console.log(
              `[VehicleCmd] Destroyed old vehicle for ${player.name}`
            );
          } catch (e) {
            console.log(
              `[VehicleCmd] Failed to destroy old vehicle for ${player.name}:`,
              e.message
            );
            console.log(`[VehicleCmd] Error stack:`, e.stack);
          }
        }

        // Obține poziția jucătorului
        // Wiki: Entity::position property
        const pos = player.position;

        // Adaugă +1.0 pe Z pentru a preveni "îngroparea" vehiculului în pământ
        const spawnPos = new mp.Vector3(pos.x, pos.y, pos.z + 1.0);

        // Model hash: folosim joaat pentru nume model (ex: m4comp, adder, etc.)
        // Wiki: mp.joaat - convertește string în hash numeric
        let modelHash;
        const asNumber = Number(model);
        if (Number.isFinite(asNumber) && asNumber > 0) {
          // Dacă modelul e deja numeric (hash direct), folosește-l
          modelHash = asNumber;
          console.log(`[VehicleCmd] Using numeric hash: ${modelHash}`);
        } else {
          // Altfel, convertește string-ul în hash cu joaat
          modelHash = mp.joaat(model);
          console.log(
            `[VehicleCmd] Converted "${model}" to hash: ${modelHash}`
          );
        }

        // Spawn vehicle
        // Wiki: Vehicles::new - creează un vehicul nou
        // Semnătură: mp.vehicles.new(modelHash, position, options)
        // Options poate include heading, numberPlate, color, locked, engine, etc.
        // Wiki: Player::heading property - orientarea jucătorului în grade
        const veh = mp.vehicles.new(modelHash, spawnPos, {
          heading: player.heading || 0,
          numberPlate: "ADMIN",
          // TODO: Culoare - verifică în wiki Vehicle::color1/color2 sau Vehicle::setColor
          // Pentru moment, lasă default culoarea pentru a evita crash-uri
        });

        if (!veh) {
          player.call("chat:push", [
            "[VehicleCmd] Failed to spawn vehicle (invalid model?)",
            "#ff0000",
          ]);
          console.log(
            `[VehicleCmd] Spawn returned null/undefined for model=${model} (hash=${modelHash}) player=${player.name}`
          );
          return;
        }

        console.log(
          `[VehicleCmd] Vehicle spawned successfully: model=${model} hash=${modelHash} id=${
            veh.id || "unknown"
          } pos=${spawnPos.x.toFixed(2)},${spawnPos.y.toFixed(
            2
          )},${spawnPos.z.toFixed(2)}`
        );

        // Warp player la volan
        // Wiki: Player::putIntoVehicle - pune jucătorul în vehicul
        // Parametrii: (vehicle, seat) - seat 0 = driver
        try {
          player.putIntoVehicle(veh, 0);
          console.log(
            `[VehicleCmd] Warped ${player.name} into vehicle (seat 0)`
          );
        } catch (e) {
          console.log(
            `[VehicleCmd] Failed to warp ${player.name} into vehicle:`,
            e.message
          );
          console.log(`[VehicleCmd] Error stack:`, e.stack);
          // Nu returnăm aici - vehiculul e creat, chiar dacă warping-ul a eșuat
        }

        // Feedback către jucător prin chat custom
        player.call("chat:push", [`[VehicleCmd] Spawned: ${model}`, "#00ff00"]);
      } catch (e) {
        console.log(
          `[VehicleCmd] ERROR spawning vehicle for ${
            player?.name || "unknown"
          }:`,
          e.message
        );
        console.log(`[VehicleCmd] Error stack:`, e.stack);

        try {
          player.call("chat:push", [
            "[VehicleCmd] ERROR: failed to spawn vehicle",
            "#ff0000",
          ]);
        } catch (_) {
          // Player poate fi deja disconnect, ignoră eroarea de output
        }
      }

      return;
    }

    // Handler pentru /me [text]
    if (cmd === "me") {
      if (!rest || rest.trim().length === 0) {
        // Mesaj de eroare doar pentru player
        player.call("chat:push", ["Syntax: /me [action]", "#ff0000"]);
        return;
      }

      const actionText = rest.trim();
      const formattedMessage = `* ${player.name} ${actionText}`;
      const color = "#b86bff"; // Mov pentru /me

      console.log(`[Chat] /me: ${formattedMessage}`);

      // Broadcast la toți jucătorii
      mp.players.forEach((p) => {
        try {
          p.call("chat:push", [formattedMessage, color]);
        } catch (e) {
          console.log(
            `[Chat] Failed to send /me to ${p?.name || "unknown"}:`,
            e.message
          );
        }
      });

      return;
    }

    // Handler pentru /stats
    if (cmd === "stats") {
      try {
        // Încarcă datele jucătorului
        // Folosește același sistem ca storage.js
        // Accesăm banii din player.data.money (dacă există) sau din JSON
        let money = 1000; // Default

        // Încearcă să obțină bani din player.data (setat de storage.js)
        if (player.data && typeof player.data.money === "number") {
          money = player.data.money;
          console.log(`[Chat] /stats loaded money from player.data: ${money}`);
        } else {
          // Fallback: încarcă din JSON
          const profile = loadPlayerData(player.name);
          if (profile) {
            money = profile.money ?? profile.data?.money ?? 1000;
            console.log(`[Chat] /stats loaded money from JSON: ${money}`);
          }
        }

        // Formatează mesajul
        const statsMessage = `Bani: $${money.toLocaleString()}`;

        // Trimite doar playerului (nu la toți)
        player.call("chat:push", [statsMessage, "#ffffff"]);
        console.log(`[Chat] /stats sent to ${player.name}: ${statsMessage}`);
      } catch (e) {
        console.log(`[Chat] ERROR in /stats for ${player.name}:`, e.message);
        console.log(`[Chat] Error stack:`, e.stack);

        // Trimite mesaj de eroare playerului
        try {
          player.call("chat:push", [
            "Eroare la încărcarea statisticilor.",
            "#ff0000",
          ]);
        } catch (_) {}
      }

      return;
    }

    // Handler pentru /server - deschide dashboard server stats
    if (cmd === "server") {
      try {
        console.log(`[ChatCmd] ${player.name}: /server`);
        
        // Deschide dashboard-ul
        adminPanel.openDashboard(player);
        
        // Feedback opțional către jucător
        player.call("chat:push", [
          "[AdminPanel] Dashboard opened.",
          "#9fd3ff",
        ]);
      } catch (e) {
        console.log(
          `[Chat] ERROR in /server command for ${player.name}:`,
          e.message
        );
        console.log(`[Chat] Error stack:`, e.stack);
        try {
          player.call("chat:push", [
            "[AdminPanel] Error opening dashboard",
            "#ff0000",
          ]);
        } catch (_) {}
      }

      return;
    }

    // Comandă necunoscută
    console.log(`[ChatCmd] Unknown command from ${player.name}: /${cmd}`);

    // Trimite mesaj roșu doar playerului
    try {
      player.call("chat:push", [`Comandă necunoscută: /${cmd}`, "#ff0000"]);
    } catch (e) {
      console.log(
        `[Chat] Failed to send error message to ${player.name}:`,
        e.message
      );
    }
  } catch (e) {
    console.log(
      `[Chat] ERROR in server:command for ${player?.name || "unknown"}:`,
      e.message
    );
    console.log(`[Chat] Error stack:`, e.stack);
  }
});

console.log("[Chat] Chat system module loaded");
