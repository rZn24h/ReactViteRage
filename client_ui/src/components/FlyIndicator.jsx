// [UI] Componentă React pentru indicator Fly Mode
// Afișează starea fly mode (ON/OFF) și speed multiplier în colțul dreapta-sus
// Styling cu Tailwind CSS

import React from 'react';

/**
 * FlyIndicator - Indicator pentru fly mode
 * @param {Object} props - Props componentă
 * @param {boolean} props.active - Starea fly mode (true = ON, false = OFF)
 * @param {number} props.speed - Multiplier de viteză (1.0x sau 3.0x)
 */
function FlyIndicator({ active, speed = 1.0 }) {
  // Nu afișa dacă fly mode este dezactivat
  if (!active) {
    return null;
  }

  console.log('[UI] FlyIndicator rendered:', { active, speed });

  return (
    <div className="fixed top-4 right-4 bg-black/80 text-white px-4 py-2 rounded-lg shadow-lg border border-green-500">
      <div className="flex items-center gap-2">
        <span className="text-green-400 font-bold">FLY MODE: ON</span>
        <span className="text-gray-300">|</span>
        <span className="text-yellow-400">Speed: {speed.toFixed(1)}x</span>
      </div>
    </div>
  );
}

export default FlyIndicator;
