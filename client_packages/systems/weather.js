// client_packages/systems/weather.js
// Per-player time & weather controls (client-side).
// Asigură-te că nu există alt script care forțează timpul global (setClockTime) peste acest override.

mp.events.add('client:setTime', (hour, minute) => {
  try {
    const h = Number(hour);
    const m = Number(minute);

    // fallback safe
    const hh = Number.isFinite(h) ? Math.max(0, Math.min(23, Math.floor(h))) : 12;
    const mm = Number.isFinite(m) ? Math.max(0, Math.min(59, Math.floor(m))) : 0;

    mp.game.time.setClockTime(hh, mm, 0);
    console.log(`[Time] Client time set to ${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`);
  } catch (e) {
    console.log('[Time] Failed set time:', e);
  }
});

mp.events.add('client:setWeather', (weather) => {
  try {
    const w = String(weather ?? 'CLEAR').trim().toUpperCase() || 'CLEAR';

    mp.game.gameplay.setOverrideWeather(w);
    mp.game.gameplay.setWeatherTypeNow(w);

    console.log(`[Weather] Client weather set to ${w}`);
  } catch (e) {
    console.log('[Weather] Failed set weather:', e);
  }
});
