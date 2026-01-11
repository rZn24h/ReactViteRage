// packages/core/systems/weather.js
// Sistem Weather/Time per-player (client-side only).

const WEATHER_BY_ID = [
  'EXTRASUNNY',      // 0
  'CLEAR',           // 1
  'CLOUDS',          // 2
  'SMOG',            // 3
  'FOGGY',           // 4
  'OVERCAST',        // 5
  'RAIN',            // 6
  'THUNDER',         // 7
  'CLEARING',        // 8
  'NEUTRAL',         // 9
  'SNOW',            // 10
  'BLIZZARD',        // 11
  'SNOWLIGHT',       // 12
  'XMAS',            // 13
  'HALLOWEEN',       // 14
  'RAIN_HALLOWEEN',  // 15
  'SNOW_HALLOWEEN',  // 16
];

const WEATHER_TO_ID = WEATHER_BY_ID.reduce((acc, name, idx) => {
  acc[name] = idx;
  return acc;
}, {});

function parseWeather(input) {
  const raw = String(input ?? '').trim();
  if (!raw) return { name: 'CLEAR', id: 1, valid: false };

  const n = Number(raw);
  if (Number.isInteger(n) && n >= 0 && n <= 16) {
    return { name: WEATHER_BY_ID[n], id: n, valid: true };
  }

  const name = raw.toUpperCase();
  if (Object.prototype.hasOwnProperty.call(WEATHER_TO_ID, name)) {
    return { name, id: WEATHER_TO_ID[name], valid: true };
  }

  return { name: 'CLEAR', id: 1, valid: false };
}

function clampInt(n, min, max, fallback) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  const i = Math.floor(v);
  if (i < min || i > max) return fallback;
  return i;
}

/**
 * /sett [hour] [minute]
 * - per player (client-side clock)
 */
function setClientTime(player, hour, minute) {
  try {
    if (!player.data) player.data = {};

    const h = clampInt(hour, 0, 23, 12);
    const m = clampInt(minute, 0, 59, 0);

    player.data.myTime = { h, m };

    player.call('client:setTime', [h, m]);

    console.log(`[Time] Client time set to ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')} for ${player.name}`);
    return { h, m };
  } catch (e) {
    console.log(`[Time] setClientTime failed for ${player?.name}:`, e);
    return { h: 12, m: 0 };
  }
}

/**
 * /setw [weather]
 * - per player (client-side override)
 */
function setClientWeather(player, input) {
  try {
    if (!player.data) player.data = {};

    const parsed = parseWeather(input);
    player.data.myWeather = parsed.name;
    player.data.myWeatherId = parsed.id;

    player.call('client:setWeather', [parsed.name]);

    console.log(`[Weather] Client weather set to ${parsed.name} (id=${parsed.id}) for ${player.name}`);
    return parsed;
  } catch (e) {
    console.log(`[Weather] setClientWeather failed for ${player?.name}:`, e);
    return { name: 'CLEAR', id: 1, valid: false };
  }
}

module.exports = {
  WEATHER_BY_ID,
  WEATHER_TO_ID,
  parseWeather,
  setClientTime,
  setClientWeather,
};
