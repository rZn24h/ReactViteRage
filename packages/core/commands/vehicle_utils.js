// [Server] Vehicle Utils - Comenzi utile pentru vehicule
// Conține: /fix, /dv, /flip, /color
// Environment: Node.js (CommonJS)
// 
// NOTĂ: Comenzile sunt gestionate prin chat custom (server:command)
// Commands are handled via custom chat (server:command)

/**
 * Calculează distanța între două puncte 3D
 * @param {mp.Vector3} pos1 - Prima poziție
 * @param {mp.Vector3} pos2 - A doua poziție
 * @returns {number} Distanța în metri
 */
function getDistance(pos1, pos2) {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const dz = pos1.z - pos2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Găsește cel mai apropiat vehicul de jucător într-o rază dată
 * @param {PlayerMp} player - Jucătorul
 * @param {number} radius - Raza de căutare în metri (default: 2)
 * @returns {VehicleMp|null} Cel mai apropiat vehicul sau null
 */
function findNearestVehicle(player, radius = 2) {
  try {
    const playerPos = player.position;
    let nearestVeh = null;
    let minDistance = radius;

    // Wiki: Vehicles::toArray - returnează array cu toate vehiculele
    const vehicles = mp.vehicles.toArray();

    for (const veh of vehicles) {
      if (!veh || !veh.valid) continue;

      const distance = getDistance(playerPos, veh.position);
      if (distance < minDistance) {
        minDistance = distance;
        nearestVeh = veh;
      }
    }

    return nearestVeh;
  } catch (e) {
    console.log(`[VehicleUtils] Error finding nearest vehicle:`, e);
    return null;
  }
}

/**
 * Comandă: /fix - Repară complet vehiculul curent
 * @param {PlayerMp} player - Jucătorul
 * @returns {boolean} Success
 */
function fixVehicle(player) {
  try {
    // Verifică dacă jucătorul este într-un vehicul
    if (!player.vehicle) {
      player.call("chat:push", [
        "[VehicleUtils] Trebuie să fii într-un vehicul.",
        "#ff0000",
      ]);
      console.log(`[VehicleUtils] ${player.name} tried /fix but not in vehicle`);
      return false;
    }

    const veh = player.vehicle;

    // Wiki: Vehicle::repair - repară vehiculul
    veh.repair();

    // Resetează viața motorului la 1000
    // Wiki: Vehicle::engineHealth property
    if (veh.engineHealth !== undefined) {
      veh.engineHealth = 1000;
    }

    // Curăță murdăria
    // Wiki: Vehicle::dirtLevel property
    if (veh.dirtLevel !== undefined) {
      veh.dirtLevel = 0;
    }

    console.log(`[VehicleUtils] ${player.name} repaired vehicle ${veh.id || "unknown"}`);
    player.call("chat:push", ["[VehicleUtils] Vehicul reparat.", "#00ff00"]);
    return true;
  } catch (e) {
    console.log(`[VehicleUtils] Error in fixVehicle for ${player?.name}:`, e);
    console.log(`[VehicleUtils] Error stack:`, e.stack);
    try {
      player.call("chat:push", [
        "[VehicleUtils] Eroare la repararea vehiculului.",
        "#ff0000",
      ]);
    } catch (_) {}
    return false;
  }
}

/**
 * Comandă: /dv - Șterge vehiculul curent sau cel mai apropiat
 * @param {PlayerMp} player - Jucătorul
 * @returns {boolean} Success
 */
function deleteVehicle(player) {
  try {
    let veh = null;

    // Dacă jucătorul este într-un vehicul, șterge-l
    if (player.vehicle) {
      veh = player.vehicle;
      console.log(`[VehicleUtils] ${player.name} deleting current vehicle ${veh.id || "unknown"}`);
    } else {
      // Caută cel mai apropiat vehicul în rază de 2 metri
      veh = findNearestVehicle(player, 2);
      if (!veh) {
        player.call("chat:push", [
          "[VehicleUtils] Nu există vehicul în apropiere (rază 2m).",
          "#ff0000",
        ]);
        console.log(`[VehicleUtils] ${player.name} tried /dv but no vehicle nearby`);
        return false;
      }
      console.log(`[VehicleUtils] ${player.name} deleting nearest vehicle ${veh.id || "unknown"}`);
    }

    // Wiki: Entity::destroy - distruge vehiculul
    veh.destroy();

    console.log(`[VehicleUtils] Vehicle ${veh.id || "unknown"} destroyed for ${player.name}`);
    player.call("chat:push", ["[VehicleUtils] Vehicul șters.", "#00ff00"]);
    return true;
  } catch (e) {
    console.log(`[VehicleUtils] Error in deleteVehicle for ${player?.name}:`, e);
    console.log(`[VehicleUtils] Error stack:`, e.stack);
    try {
      player.call("chat:push", [
        "[VehicleUtils] Eroare la ștergerea vehiculului.",
        "#ff0000",
      ]);
    } catch (_) {}
    return false;
  }
}

/**
 * Comandă: /flip - Întoarce mașina pe roți
 * @param {PlayerMp} player - Jucătorul
 * @returns {boolean} Success
 */
function flipVehicle(player) {
  try {
    // Verifică dacă jucătorul este într-un vehicul
    if (!player.vehicle) {
      player.call("chat:push", [
        "[VehicleUtils] Trebuie să fii într-un vehicul.",
        "#ff0000",
      ]);
      console.log(`[VehicleUtils] ${player.name} tried /flip but not in vehicle`);
      return false;
    }

    const veh = player.vehicle;

    // Obține poziția și rotația curentă
    // Wiki: Entity::position property
    // Wiki: Entity::rotation property
    const pos = veh.position;
    const rot = veh.rotation;

    // Setează rotația la (0, 0, currentZ) pentru a o îndrepta, dar păstrând direcția
    // Păstrăm Z-ul pentru a menține direcția
    const newRot = new mp.Vector3(0, 0, rot.z);

    // Ridică puțin mașina (position.z + 1) ca să nu intre în asfalt
    const newPos = new mp.Vector3(pos.x, pos.y, pos.z + 1.0);

    // Aplică noile valori
    veh.rotation = newRot;
    veh.position = newPos;

    console.log(
      `[VehicleUtils] ${player.name} flipped vehicle ${veh.id || "unknown"} at pos (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`
    );
    player.call("chat:push", ["[VehicleUtils] Vehicul întors pe roți.", "#00ff00"]);
    return true;
  } catch (e) {
    console.log(`[VehicleUtils] Error in flipVehicle for ${player?.name}:`, e);
    console.log(`[VehicleUtils] Error stack:`, e.stack);
    try {
      player.call("chat:push", [
        "[VehicleUtils] Eroare la întoarcerea vehiculului.",
        "#ff0000",
      ]);
    } catch (_) {}
    return false;
  }
}

/**
 * Comandă: /color [primary] [secondary] - Schimbă culoarea mașinii
 * @param {PlayerMp} player - Jucătorul
 * @param {string|number} primary - ID culoare primară (0-150) sau "black"/"white"
 * @param {string|number} secondary - ID culoare secundară (0-150) sau "black"/"white"
 * @returns {boolean} Success
 */
function setVehicleColor(player, primary, secondary) {
  try {
    // Verifică dacă jucătorul este într-un vehicul
    if (!player.vehicle) {
      player.call("chat:push", [
        "[VehicleUtils] Trebuie să fii într-un vehicul.",
        "#ff0000",
      ]);
      console.log(`[VehicleUtils] ${player.name} tried /color but not in vehicle`);
      return false;
    }

    const veh = player.vehicle;

    // Funcție helper pentru a converti input în ID culoare
    function parseColor(input) {
      if (input === undefined || input === null) return null;

      const str = String(input).trim().toLowerCase();

      // Preset-uri
      if (str === "black" || str === "negru") return 0;
      if (str === "white" || str === "alb") return 111;

      // Încearcă să convertească în număr
      const num = Number(input);
      if (Number.isFinite(num) && num >= 0 && num <= 150) {
        return Math.floor(num);
      }

      return null;
    }

    // Parse culori
    let color1 = parseColor(primary);
    let color2 = parseColor(secondary);

    // Dacă nu se dau argumente, folosește default (negru sau alb)
    if (color1 === null && color2 === null) {
      color1 = 0; // Negru
      color2 = 0; // Negru
    } else if (color1 === null) {
      color1 = 0; // Default primar
    } else if (color2 === null) {
      color2 = color1; // Folosește aceeași culoare pentru secundar
    }

    // Wiki: Vehicle::setColor - setează culoarea vehiculului
    // Parametrii: (color1, color2) - ID-uri de culoare (0-150)
    veh.setColor(color1, color2);

    console.log(
      `[VehicleUtils] ${player.name} set vehicle ${veh.id || "unknown"} color to (${color1}, ${color2})`
    );
    player.call(
      "chat:push",
      [`[VehicleUtils] Culoare setată: ${color1}, ${color2}`, "#00ff00"]
    );
    return true;
  } catch (e) {
    console.log(`[VehicleUtils] Error in setVehicleColor for ${player?.name}:`, e);
    console.log(`[VehicleUtils] Error stack:`, e.stack);
    try {
      player.call("chat:push", [
        "[VehicleUtils] Eroare la setarea culorii.",
        "#ff0000",
      ]);
    } catch (_) {}
    return false;
  }
}

module.exports = {
  fixVehicle,
  deleteVehicle,
  flipVehicle,
  setVehicleColor,
  findNearestVehicle,
};

console.log("[VehicleUtils] Vehicle utils module loaded (handled via chat system)");
